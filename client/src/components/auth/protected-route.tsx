// src/components/auth/protected-route.tsx

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // If they're trying to access chat, show a specific chat auth prompt
        if (location.pathname === '/chat') {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="max-w-md w-full mx-4 text-center space-y-6 p-8 rounded-xl border bg-card shadow-lg">
                        <div className="space-y-4">
                            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-8 h-8 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold">Join the Conversation</h1>
                                <p className="text-muted-foreground">
                                    Start chatting with AI assistant by creating an account or signing in.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Link to="/signup">
                                <Button className="w-full gradient-primary shadow-glow">
                                    Create Account
                                </Button>
                            </Link>
                            <Link to="/login" state={{ from: location }}>
                                <Button variant="outline" className="w-full">
                                    Sign In
                                </Button>
                            </Link>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            <Lock className="w-3 h-3 inline mr-1" />
                            Your conversations are private and secure
                        </p>
                    </div>
                </div>
            );
        }

        // For other protected routes, use the standard redirect
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
