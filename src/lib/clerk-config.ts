/**
 * Clerk integration config.
 *
 * The publishable key is a PUBLIC env var (safe to expose — it only identifies
 * the Clerk instance). When it is absent (e.g. first boot before the key is
 * added in the Keys tab) the app falls back to the built-in Convex Auth email
 * OTP flow instead of crashing — the rest of the console is unaffected.
 */
const KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "").trim();

/** True when a real publishable key (pk_test_* or pk_live_*) is configured. */
export const CLERK_ENABLED = /^pk_(test|live)_/.test(KEY);

export const CLERK_PUBLISHABLE_KEY = KEY;

/**
 * CropX terminal-themed Clerk appearance. Token values reference the app's
 * CSS variables directly, so the dark/light toggle re-skins Clerk live with
 * no extra wiring.
 */
export const clerkAppearance = {
  variables: {
    fontFamily: "var(--font-plex-sans)",
    fontFamilyButtons: "var(--font-plex-mono)",
    fontSize: "13.5px",
    borderRadius: "0.375rem",
    // paper/ink surfaces, not the default purple
    background: "var(--card)",
    foreground: "var(--foreground)",
    primaryColor: "var(--primary)",
    primaryText: "var(--primary-foreground)",
    inputBackground: "var(--background)",
    inputText: "var(--foreground)",
    border: "var(--border)",
    borderColor: "var(--border)",
    dividerColor: "var(--border)",
    mutedForeground: "var(--muted-foreground)",
    headerTitle: "var(--foreground)",
    headerSubtitle: "var(--muted-foreground)",
    formFieldLabel: "var(--muted-foreground)",
    formFieldInputText: "var(--foreground)",
    formButtonPrimaryBackground: "var(--primary)",
    formButtonPrimaryText: "var(--primary-foreground)",
    formButtonPrimaryTextHover: "var(--primary-foreground)",
    badgeBackground: "var(--secondary)",
    badgeText: "var(--secondary-foreground)",
    navbarBackground: "var(--card)",
    avatarBackground: "var(--secondary)",
    footerActionText: "var(--muted-foreground)",
    footerActionLink: "var(--foreground)",
  },
  elements: {
    card: "border border-border shadow-md",
    headerTitle: "font-semibold text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton: "border border-border bg-secondary text-secondary-foreground hover:bg-accent",
    formButtonPrimary: "font-medium",
    footerActionLink: "underline underline-offset-2",
  },
} as const;
