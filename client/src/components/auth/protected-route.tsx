// src/components/auth/protected-route.tsx
// Updated to use Clerk authentication

import { ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isLoaded, isSignedIn } = useAuth();
    const location = useLocation();

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        // For protected routes, redirect to sign-in
        return <Navigate to="/sign-in" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
