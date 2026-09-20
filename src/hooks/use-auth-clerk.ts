import { api } from "@/convex/_generated/api";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useConvexAuth, useQuery } from "convex/react";

/**
 * Clerk implementation. Clerk owns session identity; Convex still validates
 * requests via the Clerk JWT template, so useConvexAuth remains the source of
 * truth for backend calls while Clerk supplies the user profile.
 */
export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated: isConvexAuthenticated } =
    useConvexAuth();
  const { isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const user = useQuery(api.users.currentUser);

  // Clerk owns session identity, so the route gate trusts isSignedIn. Convex
  // requests authenticate via the "convex" JWT template once configured in
  // the Clerk dashboard; until then public queries still work and
  // authenticated ones simply resolve as signed-out server-side.
  const isLoading = isAuthLoading || !isLoaded || user === undefined;
  const isAuthenticated = isSignedIn === true;

  return {
    isLoading,
    isAuthenticated,
    user,
    // Never called in the Clerk build — the Auth page renders the Clerk
    // <SignIn /> panel instead of the email-OTP forms.
    signIn: async () => {
      throw new Error("signIn() is not available in the Clerk build");
    },
    async signOut() {
      await clerkSignOut({ redirectUrl: "/" });
    },
  };
}
