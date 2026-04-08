import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthService from "@/lib/auth-service";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-config";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

type JwtAuthMode = "sign-in" | "sign-up";

interface JwtAuthFormProps {
  mode: JwtAuthMode;
  onSuccess?: () => void;
  onSwitchMode?: (mode: JwtAuthMode) => void;
}

interface JwtAuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    created_at?: string;
  };
}

const titles: Record<JwtAuthMode, { heading: string; subheading: string; submit: string }> = {
  "sign-in": {
    heading: "Welcome back",
    subheading: "Sign in with local JWT auth.",
    submit: "Sign In",
  },
  "sign-up": {
    heading: "Create an account",
    subheading: "Create a local Perception account for JWT mode.",
    submit: "Create Account",
  },
};

export function JwtAuthForm({ mode, onSuccess, onSwitchMode }: JwtAuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = titles[mode];
  const switchMode = mode === "sign-in" ? "sign-up" : "sign-in";
  const switchPath = switchMode === "sign-in" ? SIGN_IN_PATH : SIGN_UP_PATH;
  const switchLabel = switchMode === "sign-in" ? "Sign in" : "Create an account";

  const payload = useMemo(
    () =>
      mode === "sign-up"
        ? { name, email, password }
        : { email, password, remember_me: rememberMe },
    [mode, name, email, password, rememberMe]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = mode === "sign-up" ? "/auth/signup" : "/auth/login";
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as JwtAuthResponse | { detail?: string };
      if (!response.ok) {
        throw new Error("detail" in data && data.detail ? data.detail : "Authentication failed");
      }

      AuthService.setTokens(data.access_token, data.refresh_token, data.user);
      AuthService.emit("LOGIN");
      onSuccess?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-100">{copy.heading}</h1>
        <p className="text-sm text-zinc-400">{copy.subheading}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "sign-up" && (
          <div className="space-y-2">
            <Label htmlFor={`${mode}-name`} className="text-zinc-300">
              Name
            </Label>
            <Input
              id={`${mode}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ada Lovelace"
              autoComplete="name"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={`${mode}-email`} className="text-zinc-300">
            Email
          </Label>
          <Input
            id={`${mode}-email`}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${mode}-password`} className="text-zinc-300">
            Password
          </Label>
          <Input
            id={`${mode}-password`}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "sign-up" ? "At least 8 chars, upper/lower/digit" : "Enter your password"}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            required
          />
        </div>

        {mode === "sign-in" && (
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
            />
            Remember me
          </label>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : copy.submit}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-400">
        {mode === "sign-in" ? "Need an account?" : "Already have an account?"}{" "}
        {onSwitchMode ? (
          <button
            type="button"
            className="text-violet-400 hover:text-violet-300"
            onClick={() => onSwitchMode(switchMode)}
          >
            {switchLabel}
          </button>
        ) : (
          <Link className="text-violet-400 hover:text-violet-300" to={switchPath}>
            {switchLabel}
          </Link>
        )}
      </p>
    </div>
  );
}
