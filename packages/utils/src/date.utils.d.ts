import { SupportedLocale } from '@vimovies/types';
export declare function formatRuntime(minutes?: number | null, locale?: SupportedLocale): string | null;
export declare function getYear(dateStr?: string | null): number | null;
export declare function formatDate(dateStr?: string | null, locale?: SupportedLocale): string | null;
export declare function isoRuntime(minutes?: number | null): string | null;
