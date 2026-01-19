import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import type { Locale } from "./client";

const messages: Record<Locale, Record<string, unknown>> = { en, fr };

export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split(".");
  let value: unknown = messages[locale];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key; // Fallback to key if not found
    }
  }

  return typeof value === "string" ? value : key;
}
