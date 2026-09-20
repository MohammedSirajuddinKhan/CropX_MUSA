import { CLERK_ENABLED } from "@/lib/clerk-config";
import { useAuth as useAuthClerk } from "./use-auth-clerk";
import { useAuth as useAuthConvex } from "./use-auth-convex";

export type CropxUser =
  | {
      name?: string;
      email?: string;
      isAnonymous?: boolean;
    }
  | null
  | undefined; // undefined while the user profile query is in flight

export interface AuthApi {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: CropxUser;
  /**
   * Convex-Auth build only (email-OTP page). In the Clerk build this throws
   * if called — the Clerk <SignIn /> panel replaces those forms entirely.
   */
  signIn: (provider: string, formData: FormData) => Promise<unknown>;
  signOut: () => Promise<void>;
}

/**
 * Build-time-selected auth implementation.
 *
 * With a Clerk publishable key (pk_test_* / pk_live_*) configured, the Clerk
 * implementation is used: Clerk owns session identity and the Convex client
 * authenticates through the Clerk JWT template. Without a key, the built-in
 * Convex Auth email-OTP flow is used — identical call sites either way.
 *
 * Both modules are imported statically; only the selected hook is ever
 * CALLED, so provider-specific hooks never run in the wrong context.
 */
export const useAuth: () => AuthApi = CLERK_ENABLED ? useAuthClerk : useAuthConvex;
