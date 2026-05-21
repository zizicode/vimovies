import { SupportedLocale } from '@vimovies/types';
/**
 * Obtiene un campo localizado con fallback a español.
 */
export declare function getLocalized<T extends Record<string, unknown>>(obj: T, field: string, locale?: SupportedLocale): string | null;
/**
 * Detecta locale desde Accept-Language.
 */
export declare function detectLocaleFromHeader(acceptLanguage?: string | null): SupportedLocale;
