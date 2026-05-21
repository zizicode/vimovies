import { SupportedLocale } from '@vimovies/types';
type LocalizedField = {
    title_es?: string | null;
    title_en?: string | null;
    name_es?: string | null;
    name_en?: string | null;
};
export declare function buildMediaTitle(media: LocalizedField & {
    release_date?: string | null;
}, locale?: SupportedLocale): string;
export declare function buildGenreTitle(genre: LocalizedField, locale?: SupportedLocale): string;
export declare function buildPersonTitle(name: string, locale?: SupportedLocale): string;
export declare function buildPlatformTitle(platform: LocalizedField, locale?: SupportedLocale): string;
export declare function truncateForMeta(text: string, maxLength?: number): string;
export {};
