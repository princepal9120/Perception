// src/hooks/use-auth.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, User, AuthToken, SignupData, LoginData } from '@/lib/auth-api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (data: LoginData) => Promise<void>;
    signup: (data: SignupData) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'perception_auth_token';
const USER_KEY = 'perception_auth_user';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user && !!token;

    // Load stored auth data on mount
    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Failed to parse stored user data:', error);
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            }
        }

        setIsLoading(false);
    }, []);

    // Verify token and refresh user data when token exists but user doesn't
    useEffect(() => {
        if (token && !user) {
            updateProfile();
        }
    }, [token, user]);

    const login = async (data: LoginData) => {
        try {
            setIsLoading(true);
            const authResponse: AuthToken = await authAPI.login(data);

            setToken(authResponse.access_token);
            setUser(authResponse.user);

            // Store in localStorage
            localStorage.setItem(TOKEN_KEY, authResponse.access_token);
            localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));

        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (data: SignupData) => {
        try {
            setIsLoading(true);
            await authAPI.signup(data);
            // Note: After signup, user needs to login separately
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            if (token) {
                await authAPI.logout(token);
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
            // Continue with local logout even if API call fails
        } finally {
            // Clear local state
            setUser(null);
            setToken(null);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setIsLoading(false);
        }
    };

    const updateProfile = async () => {
        if (!token) return;

        try {
            const userData = await authAPI.getProfile(token);
            setUser(userData);
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
        } catch (error) {
            console.error('Failed to update profile:', error);
            // If token is invalid, logout
            if (error instanceof Error && error.message.includes('401')) {
                await logout();
            }
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated,
                login,
                signup,
                logout,
                updateProfile,
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