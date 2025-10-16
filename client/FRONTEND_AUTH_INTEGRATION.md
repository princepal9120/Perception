# Frontend Authentication Integration Guide

## 🚀 Server Status
✅ **Authentication API**: Running on http://localhost:8002  
✅ **Database**: PostgreSQL connected  
✅ **API Documentation**: Available at http://localhost:8002/docs  

## 📋 Available Endpoints

### Authentication Endpoints
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login (returns JWT token)
- `POST /api/v1/auth/logout` - User logout (invalidates token)
- `POST /api/v1/auth/logout-all` - Logout from all sessions
- `GET /api/v1/auth/profile` - Get user profile (protected)
- `POST /api/v1/auth/change-password` - Change password (protected)
- `GET /api/v1/auth/sessions` - Get active sessions (protected)

### Health Endpoints
- `GET /` - API information
- `GET /health` - Health check
- `GET /api/v1/auth/health` - Auth service health

## 🔧 Frontend Integration

### 1. Environment Variables
Add to your frontend `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1
NEXT_PUBLIC_AUTH_URL=http://localhost:8002/api/v1/auth
```

### 2. API Client Service

Create `lib/auth-api.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8002/api/v1/auth';

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

  async signup(data: SignupData): Promise<{ success: boolean; message: string; data?: any }> {
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

  async logout(token: string): Promise<{ success: boolean; message: string }> {
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
  ): Promise<{ success: boolean; message: string }> {
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
}

export const authAPI = new AuthAPI();
```

### 3. Auth Context Hook

Create `hooks/use-auth.tsx`:

```typescript
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

  // Verify token and refresh user data
  useEffect(() => {
    if (token && !user) {
      updateProfile();
    }
  }, [token]);

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
```

### 4. Auth Components

Create `components/auth/login-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginForm() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login({ email, password, remember_me: rememberMe });
      // Redirect will be handled by the auth context
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          id="remember"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={isLoading}
        />
        <Label htmlFor="remember">Remember me</Label>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
```

Create `components/auth/signup-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SignupForm() {
  const { signup, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    try {
      await signup(formData);
      setSuccess(true);
      setFormData({
        email: '',
        password: '',
        confirm_password: '',
        first_name: '',
        last_name: '',
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Signup failed');
    }
  };

  if (success) {
    return (
      <Alert>
        <AlertDescription>
          Account created successfully! You can now sign in with your credentials.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div>
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          value={formData.confirm_password}
          onChange={handleInputChange}
          required
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
```

### 5. Protected Route Component

Create `components/auth/protected-route.tsx`:

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

### 6. App Layout Integration

Update your `app/layout.tsx`:

```typescript
import { AuthProvider } from '@/hooks/use-auth';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 7. Usage Examples

Create `app/login/page.tsx`:

```typescript
'use client';

import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
```

Create `app/dashboard/page.tsx`:

```typescript
'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <h1 className="text-2xl font-bold mb-4">
                Welcome, {user?.full_name || user?.email}!
              </h1>
              <p className="text-gray-600 mb-4">
                Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </p>
              <Button onClick={handleLogout} variant="outline">
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

## 🔐 Security Best Practices

1. **Token Storage**: Tokens are stored in localStorage. Consider using httpOnly cookies for production.

2. **HTTPS**: Always use HTTPS in production.

3. **Token Expiry**: Implement token refresh logic for better UX.

4. **Error Handling**: Properly handle network errors and API failures.

5. **Input Validation**: Validate user inputs on both frontend and backend.

## 🧪 Testing the Integration

1. Start your Next.js frontend: `npm run dev`
2. Ensure the auth server is running: `http://localhost:8002/docs`
3. Navigate to `/signup` to create a test account
4. Login at `/login` 
5. Access protected routes like `/dashboard`

The JWT token will be automatically included in API requests and the auth state will persist across browser refreshes.