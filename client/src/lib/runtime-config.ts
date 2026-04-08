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

export const validateRuntimeConfig = (config: RuntimeProviderConfig): string[] => {
  const normalized = normalizeRuntimeConfig(config);
  const errors: string[] = [];

  if (!normalized.modelName) {
    errors.push("Model name is required.");
  }

  if (normalized.modelProvider === "openai_compatible" && !normalized.baseUrl) {
    errors.push("Base URL is required for OpenAI-compatible providers.");
  }

  if ((normalized.modelProvider === "groq" || normalized.modelProvider === "google") && !normalized.apiKey) {
    errors.push(`API key is required for ${normalized.modelProvider} providers.`);
  }

  if ((normalized.searchProvider === "tavily" || normalized.searchProvider === "both") && !normalized.tavilyApiKey) {
    errors.push("Tavily API key is required when Tavily search is enabled.");
  }

  return errors;
};

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

export const getRuntimeConfigHeaders = (): Record<string, string> => {
  const config = getRuntimeConfig();
  if (!config) {
    return {};
  }

  const errors = validateRuntimeConfig(config);
  if (errors.length > 0) {
    return {};
  }

  return {
    [RUNTIME_CONFIG_HEADER]: encodeBase64Url(
      JSON.stringify({
        model_provider: config.modelProvider,
        model_name: config.modelName,
        api_key: config.apiKey || undefined,
        base_url: config.baseUrl || undefined,
        search_provider: config.searchProvider,
        tavily_api_key: config.tavilyApiKey || undefined,
      }),
    ),
  };
};

export const hasSavedRuntimeConfig = (): boolean => !!getRuntimeConfig();
