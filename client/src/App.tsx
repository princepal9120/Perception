import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import Chat from "./pages/chat/Chat";
import NotFound from "./pages/NotFound";
import WorkflowPage from "@/pages/WorkflowPage";

const queryClient = new QueryClient();

// Clerk auth page wrapper with consistent styling
const ClerkAuthPage = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
    <div className="w-full max-w-md p-4">
      {children}
    </div>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Clerk Auth routes */}
        <Route
          path="/sign-in/*"
          element={
            <ClerkAuthPage>
              <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                afterSignInUrl="/chat"
              />
            </ClerkAuthPage>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <ClerkAuthPage>
              <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                afterSignUpUrl="/chat"
              />
            </ClerkAuthPage>
          }
        />

        {/* Legacy redirect for old links */}
        <Route path="/login" element={<Navigate to="/sign-in" replace />} />
        <Route path="/signup" element={<Navigate to="/sign-up" replace />} />
        <Route path="/auth/login" element={<Navigate to="/sign-in" replace />} />
        <Route path="/auth/signup" element={<Navigate to="/sign-up" replace />} />

        {/* Chat route - now accessible to guests with limit */}
        <Route
          path="/chat"
          element={
            <ErrorBoundary>
              <Chat />
            </ErrorBoundary>
          }
        />

        {/* Protected workflow route */}
        <Route
          path="/workflow/:chatId"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <WorkflowPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="perception-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
