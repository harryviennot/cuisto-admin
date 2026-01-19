"use client";

import { useLocale } from "@/i18n/context";
import { SUPPORTED_LOCALES, Locale } from "@/i18n/client";
import clsx from "clsx";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-elevated border border-border p-1">
      {SUPPORTED_LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc as Locale)}
          className={clsx(
            "px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
            locale === loc
              ? "bg-primary text-white shadow-soft"
              : "text-text-muted hover:text-text-body hover:bg-surface-texture-light"
          )}
        >
          {t(`languageSwitcher.${loc}`)}
        </button>
      ))}
    </div>
  );
}
