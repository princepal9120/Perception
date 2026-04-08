import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  clearRuntimeConfig,
  getDefaultRuntimeConfig,
  getRuntimeConfig,
  RuntimeProviderConfig,
  RuntimeModelProvider,
  RuntimeSearchProvider,
  saveRuntimeConfig,
  validateRuntimeConfig,
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

  useEffect(() => {
    if (isOpen) {
      setFormState(getRuntimeConfig() || getDefaultRuntimeConfig());
    }
  }, [isOpen]);

  const errors = useMemo(() => validateRuntimeConfig(formState), [formState]);
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
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="outline" onClick={handleReset}>
              Clear saved settings
            </Button>
            <div className="flex items-center gap-2">
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
