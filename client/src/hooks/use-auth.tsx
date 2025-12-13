// src/hooks/use-auth.tsx
// Auth hook that integrates Clerk with the existing app interface

import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import { createContext, useContext, ReactNode, useEffect, useState } from 'react';

// Storage key for compatibility with chatStore
const TOKEN_KEY = 'perception_auth_token';

// Keep User interface compatible with backend API
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
    signOut: () => Promise<void>;
    openSignIn: () => void;
    openSignUp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser();
    const { getToken, isLoaded: isAuthLoaded } = useClerkAuth();
    const { signOut: clerkSignOut, openSignIn, openSignUp } = useClerk();
    const [token, setToken] = useState<string | null>(null);

    const isLoading = !isUserLoaded || !isAuthLoaded;
    const isAuthenticated = !!isSignedIn && !!clerkUser;

    // Map Clerk user to our User interface
    const user: User | null = clerkUser
        ? {
            id: clerkUser.id,
            name: clerkUser.fullName || clerkUser.firstName || 'User',
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            imageUrl: clerkUser.imageUrl,
            created_at: clerkUser.createdAt?.toISOString(),
        }
        : null;

    // Get Clerk session token for API calls and sync to localStorage for chatStore
    useEffect(() => {
        const fetchToken = async () => {
            if (isAuthenticated) {
                try {
                    const sessionToken = await getToken();
                    setToken(sessionToken);
                    // Store in localStorage for chatStore compatibility
                    if (sessionToken) {
                        localStorage.setItem(TOKEN_KEY, sessionToken);
                    }
                } catch (error) {
                    console.error('Failed to get Clerk token:', error);
                    setToken(null);
                    localStorage.removeItem(TOKEN_KEY);
                }
            } else {
                setToken(null);
                localStorage.removeItem(TOKEN_KEY);
            }
        };

        fetchToken();

        // Refresh token periodically (Clerk tokens expire after ~1 minute)
        const interval = setInterval(fetchToken, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, getToken]);

    const signOut = async () => {
        try {
            localStorage.removeItem(TOKEN_KEY);
            await clerkSignOut();
            setToken(null);
            // Redirect to home page after logout
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated,
                signOut,
                openSignIn,
                openSignUp,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
