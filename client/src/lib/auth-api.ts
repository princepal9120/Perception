// src/lib/auth-api.ts

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export interface SignupData {
  email: string;
  password: string;
  username: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user?: User;
}

export interface APIResponse {
  success: boolean;
  message: string;
  data?: any;
}

class AuthAPI {
  private getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  async signup(data: SignupData): Promise<AuthToken> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Signup failed");
    }

    return response.json();
  }

  async login(data: LoginData): Promise<AuthToken> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    return response.json();
  }

  async logout(token: string): Promise<APIResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Logout failed");
    }

    return response.json();
  }

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch profile");
    }

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<AuthToken> {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Token refresh failed");
    }

    return response.json();
  }

  async checkHealth(): Promise<any> {
    const baseUrl = API_BASE_URL.replace("/api/v1", "");
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Health check failed");
    }

    return response.json();
  }
}

export const authAPI = new AuthAPI();
