export type AuthMode = "disabled" | "jwt" | "clerk";

const rawMode = (import.meta.env.VITE_AUTH_MODE || "disabled").toLowerCase();

export const authMode: AuthMode =
  rawMode === "clerk" || rawMode === "jwt" ? rawMode : "disabled";

export const isClerkAuthEnabled = authMode === "clerk";
export const isLocalAuthDisabled = authMode === "disabled";
export const isJwtAuthEnabled = authMode === "jwt";

export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";

export const LOCAL_AUTH_TOKEN =
  import.meta.env.VITE_LOCAL_AUTH_TOKEN || "perception-local-dev-token";

export const LOCAL_AUTH_USER = {
  id: "local-dev-user",
  name: "Local OSS User",
  email: "local@perception.dev",
};
