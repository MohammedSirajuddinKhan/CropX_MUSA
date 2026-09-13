import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en, type TranslationKey } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";

export const LANGUAGES = ["en", "hi", "mr"] as const;
export type Lang = (typeof LANGUAGES)[number];

export const LANG_META: Record<Lang, { label: string; native: string }> = {
  en: { label: "English", native: "English" },
  hi: { label: "Hindi", native: "हिन्दी" },
  mr: { label: "Marathi", native: "मराठी" },
};

const DICTS: Record<Lang, Partial<Record<string, string>>> = {
  en,
  hi,
  mr,
};

const STORAGE_KEY = "cropx.lang";
const HTML_LANG: Record<Lang, string> = { en: "en", hi: "hi", mr: "mr" };

function loadLang(): Lang {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (LANGUAGES as readonly string[]).includes(raw)) return raw as Lang;
  } catch {
    /* storage unavailable */
  }
  return "en";
}

/**
 * Resolve a translation with {placeholder} interpolation.
 * Falls back to English when a key is missing from the active dictionary.
 */
function makeT(lang: Lang) {
  const dict = DICTS[lang];
  return (key: TranslationKey, vars?: Record<string, string | number>): string => {
    let out: string = (dict[key] as string | undefined) ?? en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        out = out.split(`{${k}}`).join(String(v));
      }
    }
    return out;
  };
}

export type TFunc = ReturnType<typeof makeT>;

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFunc;
}

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  const value = useMemo<LangCtx>(() => ({ lang, setLang, t: makeT(lang) }), [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
