import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

/**
 * Convex Auth implementation — the default when no Clerk publishable key is
 * configured. Email-OTP sign-in/out plus the Convex user profile query.
 */
export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn: convexSignIn, signOut } = useAuthActions();

  const isLoading = isAuthLoading || user === undefined;

  return {
    isLoading,
    isAuthenticated,
    user,
    signIn: async (provider: string, formData: FormData) => {
      await convexSignIn(provider, formData);
    },
    signOut,
  };
}
