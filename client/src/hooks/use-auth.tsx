/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/clerk-react";

import AuthService from "@/lib/auth-service";
import {
  LOCAL_AUTH_TOKEN,
  LOCAL_AUTH_USER,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  isClerkAuthEnabled,
  isJwtAuthEnabled,
  isLocalAuthDisabled,
} from "@/lib/auth-config";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authMode: "disabled" | "jwt" | "clerk";
  signOut: () => Promise<void>;
  openSignIn: () => void;
  openSignUp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function normalizeUser(user: unknown): User | null {
  if (!user || typeof user !== "object") {
    return null;
  }

  const candidate = user as Record<string, unknown>;
  if (!candidate.id || !candidate.email) {
    return null;
  }

  return {
    id: String(candidate.id),
    name: typeof candidate.name === "string" && candidate.name ? candidate.name : "User",
    email: String(candidate.email),
    imageUrl: typeof candidate.imageUrl === "string" ? candidate.imageUrl : undefined,
    created_at: typeof candidate.created_at === "string" ? candidate.created_at : undefined,
  };
}

function DisabledAuthProvider({ children }: AuthProviderProps) {
  const [token] = useState(() => {
    AuthService.setSession(LOCAL_AUTH_TOKEN, null, LOCAL_AUTH_USER);
    return LOCAL_AUTH_TOKEN;
  });

  const value = useMemo<AuthContextType>(
    () => ({
      user: LOCAL_AUTH_USER,
      token,
      isLoading: false,
      isAuthenticated: true,
      authMode: "disabled",
      signOut: async () => {
        AuthService.setSession(token, null, LOCAL_AUTH_USER);
      },
      openSignIn: () => {
        window.location.href = "/chat";
      },
      openSignUp: () => {
        window.location.href = "/chat";
      },
    }),
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ClerkBackedAuthProvider({ children }: AuthProviderProps) {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useClerkAuth();
  const { signOut: clerkSignOut, openSignIn, openSignUp } = useClerk();
  const [token, setToken] = useState<string | null>(null);

  const isLoading = !isUserLoaded || !isAuthLoaded;
  const isAuthenticated = !!isSignedIn && !!clerkUser;

  const user = useMemo<User | null>(
    () =>
      clerkUser
        ? {
            id: clerkUser.id,
            name: clerkUser.fullName || clerkUser.firstName || "User",
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            imageUrl: clerkUser.imageUrl,
            created_at: clerkUser.createdAt?.toISOString(),
          }
        : null,
    [clerkUser]
  );

  useEffect(() => {
    const fetchToken = async () => {
      if (!isAuthenticated) {
        setToken(null);
        AuthService.clearTokens();
        return;
      }

      try {
        const sessionToken = await getToken();
        setToken(sessionToken);
        if (sessionToken) {
          AuthService.setSession(sessionToken, null, user);
        } else {
          AuthService.clearTokens();
        }
      } catch (error) {
        console.error("Failed to get Clerk token:", error);
        setToken(null);
        AuthService.clearTokens();
      }
    };

    fetchToken();
    const interval = setInterval(fetchToken, 30000);
    return () => clearInterval(interval);
  }, [getToken, isAuthenticated, user]);

  const signOut = useCallback(async () => {
    AuthService.clearTokens();
    await clerkSignOut();
    setToken(null);
    window.location.href = "/";
  }, [clerkSignOut]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      authMode: "clerk",
      signOut,
      openSignIn,
      openSignUp,
    }),
    [user, token, isLoading, isAuthenticated, signOut, openSignIn, openSignUp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function JwtAuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => AuthService.getAccessToken());
  const [user, setUser] = useState<User | null>(() => normalizeUser(AuthService.getUser()));
  const [isLoading, setIsLoading] = useState<boolean>(() => !!AuthService.getAccessToken() && !AuthService.getUser());

  useEffect(() => {
    const syncFromStorage = () => {
      setToken(AuthService.getAccessToken());
      setUser(normalizeUser(AuthService.getUser()));
    };

    const loadCurrentUser = async () => {
      const accessToken = AuthService.getAccessToken();
      const storedUser = normalizeUser(AuthService.getUser());

      if (!accessToken) {
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (storedUser) {
        setToken(accessToken);
        setUser(storedUser);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load current user");
        }

        const currentUser = normalizeUser(await response.json());
        AuthService.setUser(currentUser);
        setToken(accessToken);
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to restore JWT session:", error);
        AuthService.clearTokens();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCurrentUser();
    const unsubscribe = AuthService.subscribe(() => {
      syncFromStorage();
    });

    return unsubscribe;
  }, []);

  const signOut = useCallback(async () => {
    await AuthService.logout(token ?? undefined);
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!token && !!user,
      authMode: "jwt",
      signOut,
      openSignIn: () => {
        window.location.href = SIGN_IN_PATH;
      },
      openSignUp: () => {
        window.location.href = SIGN_UP_PATH;
      },
    }),
    [user, token, isLoading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  if (isLocalAuthDisabled) {
    return <DisabledAuthProvider>{children}</DisabledAuthProvider>;
  }

  if (isClerkAuthEnabled) {
    return <ClerkBackedAuthProvider>{children}</ClerkBackedAuthProvider>;
  }

  if (isJwtAuthEnabled) {
    return <JwtAuthProvider>{children}</JwtAuthProvider>;
  }

  return <DisabledAuthProvider>{children}</DisabledAuthProvider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
