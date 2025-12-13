// src/lib/auth-service.ts
// Centralized authentication service following best practices

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Storage keys
const TOKEN_KEY = 'perception_auth_token';
const REFRESH_TOKEN_KEY = 'perception_refresh_token';
const USER_KEY = 'perception_auth_user';

// Event types
export type AuthEventType = 'SESSION_EXPIRED' | 'LOGOUT' | 'TOKEN_REFRESHED' | 'LOGIN';

// Event listeners
type AuthEventListener = (event: AuthEventType) => void;
const listeners: AuthEventListener[] = [];

// Refresh state to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Auth Service - Singleton pattern for managing authentication state
 */
export const AuthService = {
    // ==================== Token Management ====================

    getAccessToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    getUser(): any | null {
        const userStr = localStorage.getItem(USER_KEY);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },

    setTokens(accessToken: string, refreshToken: string, user?: any): void {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    },

    clearTokens(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    // ==================== Event System ====================

    subscribe(listener: AuthEventListener): () => void {
        listeners.push(listener);
        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    },

    emit(event: AuthEventType): void {
        listeners.forEach(listener => listener(event));
    },

    // ==================== Session Management ====================

    /**
     * Attempt to refresh the access token
     * Uses a singleton pattern to prevent multiple simultaneous refresh attempts
     */
    async refreshAccessToken(): Promise<string | null> {
        // If already refreshing, wait for the existing promise
        if (isRefreshing && refreshPromise) {
            return refreshPromise;
        }

        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            this.handleSessionExpired();
            return null;
        }

        isRefreshing = true;
        refreshPromise = this._doRefresh(refreshToken);

        try {
            const result = await refreshPromise;
            return result;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    },

    async _doRefresh(refreshToken: string): Promise<string | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                // Refresh token is expired or invalid
                this.handleSessionExpired();
                return null;
            }

            const data = await response.json();

            // Update tokens
            this.setTokens(data.access_token, data.refresh_token, data.user);
            this.emit('TOKEN_REFRESHED');

            return data.access_token;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.handleSessionExpired();
            return null;
        }
    },

    /**
     * Handle session expiration - IMMEDIATE logout
     */
    handleSessionExpired(): void {
        console.warn('Session expired - logging out immediately');
        this.clearTokens();
        this.emit('SESSION_EXPIRED');

        // Redirect to login immediately
        if (typeof window !== 'undefined' && window.location.pathname !== '/sign-in') {
            window.location.href = '/sign-in?session_expired=true';
        }
    },

    /**
     * Explicit logout
     */
    async logout(token?: string): Promise<void> {
        // Try to call logout API but don't wait or fail
        if (token) {
            try {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
            } catch (e) {
                // Ignore errors
            }
        }

        this.clearTokens();
        this.emit('LOGOUT');

        if (typeof window !== 'undefined') {
            window.location.href = '/sign-in';
        }
    },

    // ==================== Fetch Wrapper ====================

    /**
     * Fetch with automatic token refresh and session expiry handling
     */
    async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
        const token = this.getAccessToken();

        if (!token) {
            this.handleSessionExpired();
            throw new Error('No access token available');
        }

        // Add auth header
        const headers = new Headers(options.headers);
        headers.set('Authorization', `Bearer ${token}`);
        headers.set('Content-Type', 'application/json');

        let response = await fetch(url, { ...options, headers });

        // Handle 401 - try to refresh token once
        if (response.status === 401) {
            const newToken = await this.refreshAccessToken();

            if (newToken) {
                // Retry with new token
                headers.set('Authorization', `Bearer ${newToken}`);
                response = await fetch(url, { ...options, headers });

                // If still 401 after refresh, session is truly expired
                if (response.status === 401) {
                    this.handleSessionExpired();
                    throw new Error('Session expired');
                }
            } else {
                // Refresh failed, already handled in refreshAccessToken
                throw new Error('Session expired');
            }
        }

        return response;
    },
};

// Export for convenience
export default AuthService;
