export type RuntimeModelProvider = "openai_compatible" | "groq" | "google";
export type RuntimeSearchProvider = "duckduckgo" | "tavily" | "both";

export interface RuntimeProviderConfig {
  modelProvider: RuntimeModelProvider;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
  searchProvider: RuntimeSearchProvider;
  tavilyApiKey?: string;
}

const RUNTIME_CONFIG_KEY = "perception_runtime_provider_config";
const RUNTIME_CONFIG_HEADER = "X-Perception-Runtime-Config";
const LOCAL_BASE_URL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

export interface RuntimeConfigValidationResult {
  errors: string[];
  warnings: string[];
}

export class RuntimeConfigError extends Error {
  details: string[];

  constructor(message: string, details: string[]) {
    super(message);
    this.name = "RuntimeConfigError";
    this.details = details;
  }
}

const DEFAULT_RUNTIME_CONFIG: RuntimeProviderConfig = {
  modelProvider: "openai_compatible",
  modelName: "gpt-4o-mini",
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  searchProvider: "duckduckgo",
  tavilyApiKey: "",
};

export const getDefaultRuntimeConfig = (): RuntimeProviderConfig => ({
  ...DEFAULT_RUNTIME_CONFIG,
});

export const normalizeRuntimeConfig = (
  config?: Partial<RuntimeProviderConfig> | null,
): RuntimeProviderConfig => ({
  ...DEFAULT_RUNTIME_CONFIG,
  ...config,
  modelName: config?.modelName?.trim() || DEFAULT_RUNTIME_CONFIG.modelName,
  apiKey: config?.apiKey?.trim() || "",
  baseUrl: config?.baseUrl?.trim() || DEFAULT_RUNTIME_CONFIG.baseUrl,
  tavilyApiKey: config?.tavilyApiKey?.trim() || "",
});

export const isLikelyLocalBaseUrl = (baseUrl?: string): boolean => {
  if (!baseUrl) return false;

  try {
    const url = new URL(baseUrl);
    return LOCAL_BASE_URL_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

export const getRuntimeConfigValidation = (
  config: RuntimeProviderConfig,
): RuntimeConfigValidationResult => {
  const normalized = normalizeRuntimeConfig(config);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!normalized.modelName) {
    errors.push("Model name is required.");
  }

  if (normalized.modelProvider === "openai_compatible") {
    if (!normalized.baseUrl) {
      errors.push("Base URL is required for OpenAI-compatible providers.");
    } else {
      try {
        new URL(normalized.baseUrl);
      } catch {
        errors.push("Base URL must be a valid URL.");
      }
    }

    if (!isLikelyLocalBaseUrl(normalized.baseUrl) && !normalized.apiKey) {
      errors.push("API key is required for hosted OpenAI-compatible endpoints.");
    }

    if (isLikelyLocalBaseUrl(normalized.baseUrl) && !normalized.apiKey) {
      warnings.push("No API key set. This is fine for many local servers like Ollama or LM Studio.");
    }
  }

  if (normalized.modelProvider === "groq") {
    if (!normalized.apiKey) {
      errors.push("Groq API key is required.");
    } else if (!normalized.apiKey.startsWith("gsk_")) {
      warnings.push("Groq API keys usually start with gsk_. Double-check the key if testing fails.");
    }
  }

  if (normalized.modelProvider === "google") {
    if (!normalized.apiKey) {
      errors.push("Google API key is required.");
    } else if (!normalized.apiKey.startsWith("AIza")) {
      warnings.push("Google AI Studio keys usually start with AIza. Double-check the key if testing fails.");
    }
  }

  if (normalized.searchProvider === "tavily" || normalized.searchProvider === "both") {
    if (!normalized.tavilyApiKey) {
      errors.push("Tavily API key is required when Tavily search is enabled.");
    } else if (!normalized.tavilyApiKey.startsWith("tvly-")) {
      warnings.push("Tavily keys usually start with tvly-. Double-check the key if testing fails.");
    }
  }

  return { errors, warnings };
};

export const getApiBaseUrl = (): string =>
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const isLocalApiTarget = (): boolean => isLikelyLocalBaseUrl(getApiBaseUrl());

export const getApiTargetLabel = (): string => (isLocalApiTarget() ? "Local API target" : "Remote API target");

export const getRuntimeConfig = (): RuntimeProviderConfig | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(RUNTIME_CONFIG_KEY);
  if (!raw) return null;

  try {
    return normalizeRuntimeConfig(JSON.parse(raw) as Partial<RuntimeProviderConfig>);
  } catch {
    return null;
  }
};

export const saveRuntimeConfig = (config: RuntimeProviderConfig): RuntimeProviderConfig => {
  const normalized = normalizeRuntimeConfig(config);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(RUNTIME_CONFIG_KEY, JSON.stringify(normalized));
  }
  return normalized;
};

export const clearRuntimeConfig = (): void => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(RUNTIME_CONFIG_KEY);
  }
};

export const validateRuntimeConfig = (config: RuntimeProviderConfig): string[] =>
  getRuntimeConfigValidation(config).errors;

const encodeBase64Url = (value: string): string => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window
      .btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return value;
};

export const buildRuntimeConfigHeaders = (
  config?: RuntimeProviderConfig | null,
  options?: { strictInvalid?: boolean },
): Record<string, string> => {
  const activeConfig = config ? normalizeRuntimeConfig(config) : getRuntimeConfig();
  if (!activeConfig) {
    return {};
  }

  const { errors } = getRuntimeConfigValidation(activeConfig);
  if (errors.length > 0) {
    if (options?.strictInvalid) {
      throw new RuntimeConfigError("Runtime settings are invalid.", errors);
    }
    return {};
  }

  return {
    [RUNTIME_CONFIG_HEADER]: encodeBase64Url(
      JSON.stringify({
        model_provider: activeConfig.modelProvider,
        model_name: activeConfig.modelName,
        api_key: activeConfig.apiKey || undefined,
        base_url: activeConfig.baseUrl || undefined,
        search_provider: activeConfig.searchProvider,
        tavily_api_key: activeConfig.tavilyApiKey || undefined,
      }),
    ),
  };
};

export const getRuntimeConfigHeaders = (): Record<string, string> =>
  buildRuntimeConfigHeaders(undefined, { strictInvalid: true });

export const hasSavedRuntimeConfig = (): boolean => !!getRuntimeConfig();

export const hasUsableRuntimeConfig = (): boolean => {
  const config = getRuntimeConfig();
  return !!config && getRuntimeConfigValidation(config).errors.length === 0;
};
