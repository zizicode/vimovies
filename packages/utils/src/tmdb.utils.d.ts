/** Lo que TMDB devuelve en GET /movie/{id} */
export interface TmdbMovieRaw {
    id: number;
    imdb_id: string | null;
    title: string;
    original_title: string;
    original_language: string;
    overview: string | null;
    release_date: string;
    runtime: number | null;
    popularity: number;
    poster_path: string | null;
    backdrop_path: string | null;
    genres: Array<{
        id: number;
        name: string;
    }>;
    vote_average: number;
    vote_count: number;
    status: string;
    tagline: string | null;
    production_countries: Array<{
        iso_3166_1: string;
        name: string;
    }>;
}
/** Lo que TMDB devuelve en GET /movie/{id}/credits */
export interface TmdbCreditsRaw {
    cast: Array<{
        id: number;
        name: string;
        character: string;
        order: number;
        profile_path: string | null;
        known_for_department: string;
    }>;
    crew: Array<{
        id: number;
        name: string;
        job: string;
        department: string;
        profile_path: string | null;
    }>;
}
/** Lo que TMDB devuelve en GET /movie/{id}/watch/providers */
export interface TmdbWatchProvidersRaw {
    results: Record<string, {
        link: string;
        flatrate?: Array<{
            provider_id: number;
            provider_name: string;
            logo_path: string;
        }>;
        rent?: Array<{
            provider_id: number;
            provider_name: string;
            logo_path: string;
        }>;
        buy?: Array<{
            provider_id: number;
            provider_name: string;
            logo_path: string;
        }>;
    }>;
}
/** Lo que TMDB devuelve en GET /movie/{id}/videos */
export interface TmdbVideosRaw {
    results: Array<{
        id: string;
        key: string;
        name: string;
        site: 'YouTube' | 'Vimeo';
        type: string;
        official: boolean;
        published_at: string;
        iso_639_1: string;
    }>;
}
/** Lo que TMDB devuelve en GET /person/{id} */
export interface TmdbPersonRaw {
    id: number;
    name: string;
    biography: string;
    birthday: string | null;
    deathday: string | null;
    place_of_birth: string | null;
    gender: 0 | 1 | 2 | 3;
    popularity: number;
    profile_path: string | null;
    homepage: string | null;
    imdb_id: string | null;
    also_known_as: string[];
    known_for_department: string;
}
export declare const TMDB_IMAGE_BASE: "https://image.tmdb.org/t/p";
export declare const TMDB_IMAGE_SIZES: {
    readonly poster: readonly ["w92", "w154", "w185", "w342", "w500", "w780", "original"];
    readonly backdrop: readonly ["w300", "w780", "w1280", "original"];
    readonly profile: readonly ["w45", "w185", "h632", "original"];
    readonly logo: readonly ["w45", "w92", "w154", "w185", "w300", "w500", "original"];
};
export type PosterSize = typeof TMDB_IMAGE_SIZES.poster[number];
export type BackdropSize = typeof TMDB_IMAGE_SIZES.backdrop[number];
export type ProfileSize = typeof TMDB_IMAGE_SIZES.profile[number];
/**
 * Construye la URL completa de un poster de TMDB.
 * @param path   - El path que devuelve TMDB: "/abc123.jpg"
 * @param size   - Tamaño deseado. Default: w500 (buena resolución, peso moderado)
 * @returns URL completa o null si no hay imagen
 *
 * @example
 * tmdbPosterUrl("/abc123.jpg", "w342")
 * → "https://image.tmdb.org/t/p/w342/abc123.jpg"
 */
export declare function tmdbPosterUrl(path: string | null | undefined, size?: PosterSize): string | null;
/**
 * URL de backdrop (imagen de fondo panorámica).
 * Usar w1280 para desktop hero, w780 para mobile.
 */
export declare function tmdbBackdropUrl(path: string | null | undefined, size?: BackdropSize): string | null;
/**
 * URL de foto de perfil de actor/director.
 */
export declare function tmdbProfileUrl(path: string | null | undefined, size?: ProfileSize): string | null;
/**
 * Extrae el año de una fecha de TMDB.
 * TMDB devuelve fechas como "2023-07-21"
 */
export declare function extractYear(dateStr?: string): number | null;
/**
 * Convierte el tipo de video de TMDB al enum interno.
 * TMDB usa "Trailer", "Teaser", etc. con mayúscula inicial.
 */
export declare function normalizeTmdbVideoType(tmdbType: string): 'trailer' | 'teaser' | 'clip' | 'featurette' | 'behind_the_scenes' | 'bloopers' | null;
/**
 * Determina si una película debe ser noindex basado en su popularidad TMDB.
 * Las películas con muy poca popularidad no merecen ser indexadas todavía.
 */
export declare function shouldNoindex(tmdbPopularity: number | null | undefined): boolean;
/**
 * Determina si una película debe ser pre-renderizada (SSG).
 * Solo las más populares justifican el costo de pre-rendering.
 */
export declare function shouldPrerender(tmdbPopularity: number | null | undefined, mediaType: 'movie' | 'series' | 'documentary' | 'short' | 'special'): boolean;
/**
 * Mapea el género TMDB al slug interno.
 * Los IDs de TMDB son estables — el seed del schema los define.
 */
export declare const TMDB_GENRE_SLUG_MAP: Record<number, string>;
/**
 * Mapea provider_id de TMDB al slug interno de la plataforma.
 */
export declare const TMDB_PROVIDER_SLUG_MAP: Record<number, string>;
/**
 * Extrae el trailer principal de una respuesta de videos TMDB.
 * Prioriza: oficial > español > inglés > cualquier trailer.
 */
export declare function extractPrimaryTrailer(videos: TmdbVideosRaw['results']): TmdbVideosRaw['results'][0] | null;
