// src/hooks/use-auth.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, User, AuthToken, SignupData, LoginData } from '@/lib/auth-api';
import AuthService from '@/lib/auth-service';

interface AuthContextType {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (data: LoginData) => Promise<void>;
    signup: (data: SignupData) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user && !!token;

    // Subscribe to AuthService session expiry events for IMMEDIATE logout
    useEffect(() => {
        const unsubscribe = AuthService.subscribe((event) => {
            if (event === 'SESSION_EXPIRED' || event === 'LOGOUT') {
                // Immediately clear local state
                setUser(null);
                setToken(null);
                setRefreshToken(null);
                setIsLoading(false);
            } else if (event === 'TOKEN_REFRESHED') {
                // Update token state with new token
                const newToken = AuthService.getAccessToken();
                const newRefreshToken = AuthService.getRefreshToken();
                if (newToken) setToken(newToken);
                if (newRefreshToken) setRefreshToken(newRefreshToken);
            }
        });

        return unsubscribe;
    }, []);

    // Load stored auth data on mount
    useEffect(() => {
        const storedToken = AuthService.getAccessToken();
        const storedRefreshToken = AuthService.getRefreshToken();
        const storedUser = AuthService.getUser();

        if (storedToken && storedUser) {
            setToken(storedToken);
            setRefreshToken(storedRefreshToken);
            setUser(storedUser);
        }

        setIsLoading(false);
    }, []);

    // Note: We no longer need to fetch profile after login because:
    // 1. Login/signup already return user data in TokenResponse
    // 2. User is set immediately in login/signup functions
    // This eliminates an unnecessary API call that was causing login delays

    const login = async (data: LoginData) => {
        try {
            setIsLoading(true);
            const authResponse: AuthToken = await authAPI.login(data);

            setToken(authResponse.access_token);
            setRefreshToken(authResponse.refresh_token);

            // Use user data from response if available, otherwise fetch profile
            let userData: User;
            if (authResponse.user) {
                userData = authResponse.user;
            } else {
                // Fallback to fetching profile if not included in response
                userData = await authAPI.getProfile(authResponse.access_token);
            }
            setUser(userData);

            // Store using AuthService
            AuthService.setTokens(authResponse.access_token, authResponse.refresh_token, userData);

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
            const authResponse: AuthToken = await authAPI.signup(data);

            setToken(authResponse.access_token);
            setRefreshToken(authResponse.refresh_token);

            // Use user data from response if available, otherwise fetch profile
            let userData: User;
            if (authResponse.user) {
                userData = authResponse.user;
            } else {
                // Fallback to fetching profile if not included in response
                userData = await authAPI.getProfile(authResponse.access_token);
            }
            setUser(userData);

            // Store using AuthService
            AuthService.setTokens(authResponse.access_token, authResponse.refresh_token, userData);
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
            // AuthService.logout already clears tokens
        } finally {
            // Clear local state
            setUser(null);
            setToken(null);
            setRefreshToken(null);
            AuthService.clearTokens();
            setIsLoading(false);
        }
    };

    const updateProfile = async () => {
        if (!token) return;

        try {
            const userData = await authAPI.getProfile(token);
            setUser(userData);
            // Update user in storage via AuthService
            const currentToken = AuthService.getAccessToken();
            const currentRefresh = AuthService.getRefreshToken();
            if (currentToken && currentRefresh) {
                AuthService.setTokens(currentToken, currentRefresh, userData);
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            // AuthService already handles session expiry
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                refreshToken,
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
