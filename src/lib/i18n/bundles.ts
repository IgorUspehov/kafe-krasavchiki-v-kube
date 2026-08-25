import type { Locale } from "@/lib/i18n/config";
import { mergeTranslations, type TranslationTree } from "@/lib/i18n/utils";

import enCommon from "../../../public/locales/en/common.json";
import enPresentation from "../../../public/locales/en/presentation.json";
import deCommon from "../../../public/locales/de/common.json";
import dePresentation from "../../../public/locales/de/presentation.json";
import ruCommon from "../../../public/locales/ru/common.json";
import ruPresentation from "../../../public/locales/ru/presentation.json";

export const LOCALE_BUNDLES: Record<Locale, TranslationTree> = {
  en: mergeTranslations(enCommon as TranslationTree, enPresentation as TranslationTree),
  de: mergeTranslations(deCommon as TranslationTree, dePresentation as TranslationTree),
  ru: mergeTranslations(ruCommon as TranslationTree, ruPresentation as TranslationTree),
};
