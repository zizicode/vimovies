// packages/utils/src/index.ts

// Response utils
export * from './reponse.utils';

// Slug
export { generateSlug, generateMediaSlug, generatePersonSlug } from './slug.utils'

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
} from './tmdb.utils'
export type { TmdbMovieRaw, TmdbCreditsRaw, TmdbWatchProvidersRaw, TmdbVideosRaw, TmdbPersonRaw } from './tmdb.utils'

// Locale
export { getLocalized, detectLocaleFromHeader } from './locale.utils'

// SEO
export {
  buildMediaTitle,
  buildGenreTitle,
  buildPersonTitle,
  buildPlatformTitle,
  truncateForMeta,
} from './seo.utils'

// Dates
export { formatRuntime, getYear, formatDate, isoRuntime } from './date.utils'

// Axios request utils
export * from './request.utils';
export * from './tmdb.utils';