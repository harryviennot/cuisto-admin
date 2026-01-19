export { LocaleProvider, useLocale } from "./context";
export { getTranslation } from "./translations";
export {
  SUPPORTED_LOCALES,
  getStoredLocale,
  setStoredLocale,
  getBrowserLocale,
} from "./client";
export type { Locale } from "./client";
