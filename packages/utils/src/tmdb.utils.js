"use strict";
// packages/utils/src/tmdb.utils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.TMDB_PROVIDER_SLUG_MAP = exports.TMDB_GENRE_SLUG_MAP = exports.TMDB_IMAGE_SIZES = exports.TMDB_IMAGE_BASE = void 0;
exports.tmdbPosterUrl = tmdbPosterUrl;
exports.tmdbBackdropUrl = tmdbBackdropUrl;
exports.tmdbProfileUrl = tmdbProfileUrl;
exports.extractYear = extractYear;
exports.normalizeTmdbVideoType = normalizeTmdbVideoType;
exports.shouldNoindex = shouldNoindex;
exports.shouldPrerender = shouldPrerender;
exports.extractPrimaryTrailer = extractPrimaryTrailer;
// ── Constantes de tamaños de imagen TMDB ────────────────────────────────────
exports.TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
exports.TMDB_IMAGE_SIZES = {
    poster: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
    backdrop: ['w300', 'w780', 'w1280', 'original'],
    profile: ['w45', 'w185', 'h632', 'original'],
    logo: ['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'],
};
// ── Funciones de URL de imágenes ─────────────────────────────────────────────
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
function tmdbPosterUrl(path, size) {
    if (size === void 0) { size = 'w500'; }
    if (!path)
        return null;
    return "".concat(exports.TMDB_IMAGE_BASE, "/").concat(size).concat(path);
}
/**
 * URL de backdrop (imagen de fondo panorámica).
 * Usar w1280 para desktop hero, w780 para mobile.
 */
function tmdbBackdropUrl(path, size) {
    if (size === void 0) { size = 'w1280'; }
    if (!path)
        return null;
    return "".concat(exports.TMDB_IMAGE_BASE, "/").concat(size).concat(path);
}
/**
 * URL de foto de perfil de actor/director.
 */
function tmdbProfileUrl(path, size) {
    if (size === void 0) { size = 'w185'; }
    if (!path)
        return null;
    return "".concat(exports.TMDB_IMAGE_BASE, "/").concat(size).concat(path);
}
// ── Transformadores: TMDB Raw → Formato interno DB ───────────────────────────
/**
 * Extrae el año de una fecha de TMDB.
 * TMDB devuelve fechas como "2023-07-21"
 */
function extractYear(dateStr) {
    if (!dateStr)
        return null;
    var year = Number(dateStr.split('-')[0]);
    return Number.isNaN(year) ? null : year;
}
/**
 * Convierte el tipo de video de TMDB al enum interno.
 * TMDB usa "Trailer", "Teaser", etc. con mayúscula inicial.
 */
function normalizeTmdbVideoType(tmdbType) {
    var _a;
    var map = {
        'Trailer': 'trailer',
        'Teaser': 'teaser',
        'Clip': 'clip',
        'Featurette': 'featurette',
        'Behind the Scenes': 'behind_the_scenes',
        'Bloopers': 'bloopers',
    };
    return (_a = map[tmdbType]) !== null && _a !== void 0 ? _a : null;
}
/**
 * Determina si una película debe ser noindex basado en su popularidad TMDB.
 * Las películas con muy poca popularidad no merecen ser indexadas todavía.
 */
function shouldNoindex(tmdbPopularity) {
    if (tmdbPopularity == null)
        return true;
    return tmdbPopularity < 10;
}
/**
 * Determina si una película debe ser pre-renderizada (SSG).
 * Solo las más populares justifican el costo de pre-rendering.
 */
function shouldPrerender(tmdbPopularity, mediaType) {
    if (tmdbPopularity == null)
        return false;
    var thresholds = {
        movie: 10, // Top ~1000 películas
        series: 8, // Top ~500 series
        documentary: 5,
        short: 0, // No pre-renderizar
        special: 0,
    };
    return tmdbPopularity >= thresholds[mediaType];
}
/**
 * Mapea el género TMDB al slug interno.
 * Los IDs de TMDB son estables — el seed del schema los define.
 */
exports.TMDB_GENRE_SLUG_MAP = {
    28: 'accion',
    12: 'aventura',
    16: 'animacion',
    35: 'comedia',
    80: 'crimen',
    99: 'documental',
    18: 'drama',
    10751: 'familia',
    14: 'fantasia',
    36: 'historia',
    27: 'terror',
    10402: 'musica',
    9648: 'misterio',
    10749: 'romance',
    878: 'ciencia-ficcion',
    10770: 'television',
    53: 'thriller',
    10752: 'guerra',
    37: 'western',
};
/**
 * Mapea provider_id de TMDB al slug interno de la plataforma.
 */
exports.TMDB_PROVIDER_SLUG_MAP = {
    8: 'netflix',
    119: 'prime-video',
    337: 'disney-plus',
    384: 'hbo-max',
    350: 'apple-tv-plus',
    531: 'paramount',
    619: 'star-plus',
    11: 'mubi',
    283: 'crunchyroll',
    300: 'pluto-tv',
};
/**
 * Extrae el trailer principal de una respuesta de videos TMDB.
 * Prioriza: oficial > español > inglés > cualquier trailer.
 */
function extractPrimaryTrailer(videos) {
    var trailers = videos.filter(function (v) { return v.type === 'Trailer' && v.site === 'YouTube'; });
    if (trailers.length === 0)
        return null;
    // 1. Trailer oficial en español
    var officialEs = trailers.find(function (v) { return v.official && v.iso_639_1 === 'es'; });
    if (officialEs)
        return officialEs;
    // 2. Trailer oficial en inglés
    var officialEn = trailers.find(function (v) { return v.official && v.iso_639_1 === 'en'; });
    if (officialEn)
        return officialEn;
    // 3. Cualquier trailer oficial
    var official = trailers.find(function (v) { return v.official; });
    if (official)
        return official;
    // 4. El primero disponible
    return trailers[0];
}
