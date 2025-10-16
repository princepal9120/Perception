// src/lib/auth-api.ts

const API_BASE_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:8002/api/v1/auth';

export interface SignupData {
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  full_name?: string;
}

export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface APIResponse {
  success: boolean;
  message: string;
  data?: any;
}

class AuthAPI {
  private getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async signup(data: SignupData): Promise<APIResponse> {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }
    
    return response.json();
  }

  async login(data: LoginData): Promise<AuthToken> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    
    return response.json();
  }

  async logout(token: string): Promise<APIResponse> {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: this.getHeaders(token),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Logout failed');
    }
    
    return response.json();
  }

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch profile');
    }
    
    return response.json();
  }

  async changePassword(
    token: string, 
    data: { current_password: string; new_password: string; confirm_password: string }
  ): Promise<APIResponse> {
    const response = await fetch(`${API_BASE_URL}/change-password`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Password change failed');
    }
    
    return response.json();
  }

  async checkHealth(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    
    return response.json();
  }
}

export const authAPI = new AuthAPI();