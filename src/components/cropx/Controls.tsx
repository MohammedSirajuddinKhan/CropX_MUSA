import { useTheme } from "@/hooks/use-theme";
import { LANGUAGES, LANG_META, useLang, type Lang } from "@/i18n";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

/**
 * Theme toggle — terminal-style square button with a mono state label
 * (communicates state in text, not icon alone).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={toggle}
      title={t("ctl.theme.title")}
      aria-label={t("ctl.theme.title")}
      aria-pressed={theme === "dark"}
      className={cn(
        "flex items-center gap-1.5 border border-border bg-card px-2 py-1 font-mono text-[10.5px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="size-3" /> : <Moon className="size-3" />}
      <span className="uppercase tracking-[0.1em]">
        {theme === "dark" ? t("ctl.theme.dark") : t("ctl.theme.light")}
      </span>
    </button>
  );
}

/**
 * Language switcher — EN / हिन्दी / मराठी as segmented mono buttons.
 * Native names stay in their own script by design.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <div
      role="group"
      aria-label={t("ctl.lang.title")}
      className={cn("flex items-center border border-border bg-card", className)}
    >
      {LANGUAGES.map((l: Lang, i) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "px-2 py-1 font-mono text-[10.5px] transition-colors",
            i > 0 && "border-l border-border",
            lang === l
              ? "bg-foreground font-medium text-background"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {LANG_META[l].native}
        </button>
      ))}
    </div>
  );
}
