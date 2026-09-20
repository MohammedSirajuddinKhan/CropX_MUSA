import { SignIn } from "@clerk/clerk-react";
import { useUser } from "@clerk/clerk-react";
import { clerkAppearance } from "@/lib/clerk-config";

/**
 * All Clerk-rendered UI lives in this module so it can be code-split away
 * from the default (Convex Auth) build. Rendered only when a Clerk
 * publishable key is configured.
 */

/** Terminal-framed Clerk <SignIn />, rendered on /auth in the Clerk build. */
export default function ClerkSignInPanel({
  redirectTo,
}: {
  redirectTo: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card shadow-md">
      <SignIn
        fallbackRedirectUrl={redirectTo}
        appearance={clerkAppearance}
      />
    </div>
  );
}

/** Signed-in identity line for the console sidebar (Clerk build). */
export function ClerkIdentity() {
  const { user } = useUser();
  if (!user) return null;
  const label =
    user.fullName || user.primaryEmailAddress?.emailAddress || "signed in";
  return (
    <span
      className="truncate font-mono text-[10px] text-muted-foreground"
      title={label}
    >
      {label}
    </span>
  );
}
