import { ReactNode, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/PageLoader";
import { JwtAuthForm } from "@/components/auth/JwtAuthForm";
import { SIGN_IN_PATH, SIGN_UP_PATH, isClerkAuthEnabled, isJwtAuthEnabled } from "@/lib/auth-config";

// Lazy load heavy pages for better initial load performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Chat = lazy(() => import("./pages/chat/Chat"));
const WorkflowPage = lazy(() => import("@/pages/WorkflowPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Clerk auth page wrapper with consistent styling
const AuthPageShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
    <div className="w-full max-w-md p-4">
      {children}
    </div>
  </div>
);

const JwtAuthPage = ({ mode }: { mode: "sign-in" | "sign-up" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { from?: { pathname?: string } } | null;

  return (
    <AuthPageShell>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <JwtAuthForm
          mode={mode}
          onSuccess={() => navigate(state?.from?.pathname || "/chat", { replace: true })}
        />
      </div>
    </AuthPageShell>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Clerk Auth routes */}
        <Route
          path="/sign-in/*"
          element={
            isClerkAuthEnabled ? (
              <AuthPageShell>
                <SignIn
                  routing="path"
                  path={SIGN_IN_PATH}
                  signUpUrl={SIGN_UP_PATH}
                  afterSignInUrl="/chat"
                />
              </AuthPageShell>
            ) : isJwtAuthEnabled ? (
              <JwtAuthPage mode="sign-in" />
            ) : (
              <Navigate to="/chat" replace />
            )
          }
        />
        <Route
          path="/sign-up/*"
          element={
            isClerkAuthEnabled ? (
              <AuthPageShell>
                <SignUp
                  routing="path"
                  path={SIGN_UP_PATH}
                  signInUrl={SIGN_IN_PATH}
                  afterSignUpUrl="/chat"
                />
              </AuthPageShell>
            ) : isJwtAuthEnabled ? (
              <JwtAuthPage mode="sign-up" />
            ) : (
              <Navigate to="/chat" replace />
            )
          }
        />

        {/* Legacy redirect for old links */}
        <Route path="/login" element={<Navigate to={SIGN_IN_PATH} replace />} />
        <Route path="/signup" element={<Navigate to={SIGN_UP_PATH} replace />} />
        <Route path="/auth/login" element={<Navigate to={SIGN_IN_PATH} replace />} />
        <Route path="/auth/signup" element={<Navigate to={SIGN_UP_PATH} replace />} />

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
    </Suspense>
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
