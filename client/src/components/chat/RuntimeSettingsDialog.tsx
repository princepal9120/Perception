import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { chatAPI } from "@/lib/chat-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getApiBaseUrl,
  getApiTargetLabel,
  getRuntimeConfigValidation,
  clearRuntimeConfig,
  getDefaultRuntimeConfig,
  getRuntimeConfig,
  isLocalApiTarget,
  RuntimeConfigError,
  RuntimeProviderConfig,
  RuntimeModelProvider,
  RuntimeSearchProvider,
  saveRuntimeConfig,
} from "@/lib/runtime-config";

interface RuntimeSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const providerHelp: Record<RuntimeModelProvider, string> = {
  openai_compatible: "Use OpenAI, Ollama, LM Studio, vLLM, OpenRouter, or any OpenAI-compatible endpoint.",
  groq: "Use a Groq API key and any Groq-supported model name.",
  google: "Use a Google AI Studio API key and a Gemini model name.",
};

export const RuntimeSettingsDialog = ({
  isOpen,
  onOpenChange,
}: RuntimeSettingsDialogProps) => {
  const [formState, setFormState] = useState<RuntimeProviderConfig>(getDefaultRuntimeConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setFormState(getRuntimeConfig() || getDefaultRuntimeConfig());
      setTestResult(null);
    }
  }, [isOpen]);

  const validation = useMemo(() => getRuntimeConfigValidation(formState), [formState]);
  const { errors, warnings } = validation;
  const canSave = errors.length === 0;

  const updateField = <K extends keyof RuntimeProviderConfig>(
    field: K,
    value: RuntimeProviderConfig[K],
  ) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    const normalized = saveRuntimeConfig(formState);
    setFormState(normalized);
    toast.success("Runtime settings saved", {
      description: "New chats and research requests will use this provider config.",
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    clearRuntimeConfig();
    const defaults = getDefaultRuntimeConfig();
    setFormState(defaults);
    toast.success("Runtime settings cleared", {
      description: "Perception will fall back to the backend environment defaults.",
    });
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      const result = await chatAPI.testRuntimeConfiguration(formState, token || undefined);
      setTestResult(
        `Connected to ${result.provider} using ${result.model}. Preview response: ${result.preview}`,
      );
      toast.success("Runtime connection test passed");
    } catch (error) {
      const description =
        error instanceof RuntimeConfigError
          ? error.details.join(" ")
          : error instanceof Error
            ? error.message
            : "Runtime connection test failed.";
      setTestResult(description);
      toast.error("Runtime connection test failed", {
        description,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Runtime settings</DialogTitle>
          <DialogDescription>
            Configure your model provider, API key, and search provider in this browser. This is the OSS path for trying your own stack without editing code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isLocalApiTarget() ? "secondary" : "destructive"}>
                {getApiTargetLabel()}
              </Badge>
              <span className="font-mono text-xs break-all">{getApiBaseUrl()}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              If this points to production, your browser will use the deployed API, not your local backend.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="model-provider">Model provider</Label>
              <Select
                value={formState.modelProvider}
                onValueChange={(value) => updateField("modelProvider", value as RuntimeModelProvider)}
              >
                <SelectTrigger id="model-provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai_compatible">OpenAI-compatible</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{providerHelp[formState.modelProvider]}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-name">Model name</Label>
              <Input
                id="model-name"
                value={formState.modelName}
                onChange={(event) => updateField("modelName", event.target.value)}
                placeholder={formState.modelProvider === "google" ? "gemini-2.0-flash" : formState.modelProvider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini"}
              />
            </div>
          </div>

          {formState.modelProvider === "openai_compatible" && (
            <div className="space-y-2">
              <Label htmlFor="base-url">Base URL</Label>
              <Input
                id="base-url"
                value={formState.baseUrl || ""}
                onChange={(event) => updateField("baseUrl", event.target.value)}
                placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="api-key">
              API key
              {formState.modelProvider === "openai_compatible" ? (
                <span className="ml-2 text-xs text-muted-foreground">optional for local OpenAI-compatible servers</span>
              ) : null}
            </Label>
            <Input
              id="api-key"
              type="password"
              value={formState.apiKey || ""}
              onChange={(event) => updateField("apiKey", event.target.value)}
              placeholder={formState.modelProvider === "google" ? "AIza..." : formState.modelProvider === "groq" ? "gsk_..." : "sk-..."}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search-provider">Search provider</Label>
              <Select
                value={formState.searchProvider}
                onValueChange={(value) => updateField("searchProvider", value as RuntimeSearchProvider)}
              >
                <SelectTrigger id="search-provider">
                  <SelectValue placeholder="Select search provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                  <SelectItem value="tavily">Tavily</SelectItem>
                  <SelectItem value="both">Tavily + DuckDuckGo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formState.searchProvider === "tavily" || formState.searchProvider === "both") && (
              <div className="space-y-2">
                <Label htmlFor="tavily-key">Tavily API key</Label>
                <Input
                  id="tavily-key"
                  type="password"
                  value={formState.tavilyApiKey || ""}
                  onChange={(event) => updateField("tavilyApiKey", event.target.value)}
                  placeholder="tvly-..."
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Saved locally in this browser</Badge>
            <Badge variant="outline">Used for chat + deep research requests</Badge>
          </div>

          {errors.length > 0 && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              <p className="font-medium">Fix these before saving:</p>
              <ul className="mt-2 list-disc pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-300">
              <p className="font-medium">Heads up:</p>
              <ul className="mt-2 list-disc pl-5">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {testResult && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              {testResult}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="outline" onClick={handleReset}>
              Clear saved settings
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleTestConnection} disabled={!canSave || isTesting}>
                {isTesting ? "Testing..." : "Test connection"}
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!canSave}>
                Save settings
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
