// packages/utils/src/locale.utils.ts

import { SupportedLocale } from '@vimovies/types'

/**
 * Obtiene un campo localizado con fallback a español.
 */
export function getLocalized<T extends Record<string, unknown>>(
  obj: T,
  field: string,
  locale: SupportedLocale = SupportedLocale.ES
): string | null {
  const value = obj[`${field}_${locale}`]
  const fallback = obj[`${field}_es`]

  return (value ?? fallback ?? null) as string | null
}

/**
 * Detecta locale desde Accept-Language.
 */
export function detectLocaleFromHeader(
  acceptLanguage?: string | null
): SupportedLocale {
  const primary = acceptLanguage
    ?.split(',')[0]
    ?.split('-')[0]
    ?.toLowerCase()

  return primary === SupportedLocale.EN
    ? SupportedLocale.EN
    : SupportedLocale.ES
}