// packages/utils/src/index.ts



// Slug
export { generateSlug, generateMediaSlug, generatePersonSlug } from './slug.utils.js'

// TMDB
export {
  tmdbPosterUrl,
  tmdbBackdropUrl,
  tmdbProfileUrl,
  extractYear,
  extractPrimaryTrailer,
  normalizeTmdbVideoType,
  shouldNoindex,
  shouldPrerender,
  TMDB_GENRE_SLUG_MAP,
  TMDB_PROVIDER_SLUG_MAP,
  TMDB_IMAGE_BASE,
  TMDB_IMAGE_SIZES,
} from './tmdb.utils.js'
export type { TmdbMovieRaw, TmdbCreditsRaw, TmdbWatchProvidersRaw, TmdbVideosRaw, TmdbPersonRaw } from './tmdb.utils.js'

// Locale
export { getLocalized, detectLocaleFromHeader } from './locale.utils.js'

// SEO
export {
  buildMediaTitle,
  buildGenreTitle,
  buildPersonTitle,
  buildPlatformTitle,
  truncateForMeta,
} from './seo.utils.js'

// Dates
export { formatRuntime, getYear, formatDate, isoRuntime } from './date.utils.js'

// Axios request utils
export * from './request.utils.js';
export * from './tmdb.utils.js';

// Auth
export * from './auth.utils.js';

// Response
export * from './reponse.utils.js';
