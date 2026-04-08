import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import App from "./App.tsx";
import { isClerkAuthEnabled } from "./lib/auth-config";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (isClerkAuthEnabled && !PUBLISHABLE_KEY) {
    throw new Error("Missing Clerk Publishable Key. Add VITE_CLERK_PUBLISHABLE_KEY to your .env file.");
}

// Clerk appearance customization to match project theme
const clerkAppearance = {
    baseTheme: dark,
    variables: {
        colorPrimary: "#7B61FF", 
        colorBackground: "#18181b", // zinc-900
        colorInputBackground: "#27272a", // zinc-800
        colorInputText: "#fafafa", // zinc-50
        colorText: "#fafafa", // zinc-50
        colorTextSecondary: "#a1a1aa", // zinc-400
        colorDanger: "#ef4444", // red-500
        borderRadius: "0.75rem", // rounded-lg
        fontFamily: "Inter, system-ui, sans-serif",
    },
    elements: {
        formButtonPrimary:
            "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25",
        card: "bg-zinc-900 border border-zinc-800 shadow-2xl",
        headerTitle: "text-zinc-100",
        headerSubtitle: "text-zinc-400",
        socialButtonsBlockButton: "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100",
        socialButtonsBlockButtonText: "text-zinc-100",
        formFieldLabel: "text-zinc-300",
        formFieldInput: "bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-violet-500",
        dividerLine: "bg-zinc-700",
        dividerText: "text-zinc-400",
        footerActionLink: "text-violet-400 hover:text-violet-300",
        identityPreviewText: "text-zinc-100",
        identityPreviewEditButton: "text-violet-400",
        formFieldInputShowPasswordButton: "text-zinc-400 hover:text-zinc-100",
        alertText: "text-zinc-100",
        formResendCodeLink: "text-violet-400 hover:text-violet-300",
        navbar: "bg-zinc-900",
        navbarButton: "text-zinc-400 hover:text-zinc-100",
        userButtonAvatarBox: "border-2 border-zinc-700",
        userButtonPopoverCard: "bg-zinc-900 border border-zinc-800",
        userButtonPopoverActionButton: "hover:bg-zinc-800",
        userButtonPopoverActionButtonText: "text-zinc-100",
        userButtonPopoverFooter: "border-t border-zinc-800",
    },
};

const app = <App />;

createRoot(document.getElementById("root")!).render(
    isClerkAuthEnabled ? (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance}>
            {app}
        </ClerkProvider>
    ) : (
        app
    )
);
