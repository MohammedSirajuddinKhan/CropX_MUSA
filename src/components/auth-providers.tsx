import type { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { CLERK_ENABLED, CLERK_PUBLISHABLE_KEY, clerkAppearance } from "@/lib/clerk-config";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function ClerkAuthShell({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={clerkAppearance}
      signInUrl="/auth"
    >
      <ConvexProviderWithClerk client={convex} useAuth={useClerkAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

function ConvexAuthShell({ children }: { children: ReactNode }) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}

/**
 * Build-time-selected auth provider tree.
 *
 * With a Clerk publishable key (pk_test_* / pk_live_*) configured, the app
 * uses Clerk sessions and Convex authenticates through the Clerk JWT template
 * ("convex"). Without it, the stock Convex Auth email-OTP flow is preserved —
 * so the preview works before any key is added, with zero runtime branching.
 *
 * Clerk UI lives where it belongs: <SignIn /> on /auth (rendered by the Auth
 * page when Clerk is enabled) and identity in the console sidebar.
 */
export function AuthProviders({ children }: { children: ReactNode }) {
  return CLERK_ENABLED ? (
    <ClerkAuthShell>{children}</ClerkAuthShell>
  ) : (
    <ConvexAuthShell>{children}</ConvexAuthShell>
  );
}
