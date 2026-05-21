// packages/utils/src/tmdb.utils.ts

// ── Tipos internos de TMDB (lo que nos devuelve su API) ──────────────────────

/** Lo que TMDB devuelve en GET /movie/{id} */
export interface TmdbMovieRaw {
    id:               number
    imdb_id:          string | null
    title:            string           // Título en el idioma del request
    original_title:   string
    original_language: string
    overview:         string | null
    release_date:     string           // "2023-07-21"
    runtime:          number | null    // En minutos
    popularity:       number
    poster_path:      string | null    // "/abc123.jpg"
    backdrop_path:    string | null
    genres:           Array<{ id: number; name: string }>
    vote_average:     number           // 0–10
    vote_count:       number
    status:           string           // "Released" | "Post Production" | ...
    tagline:          string | null
    production_countries: Array<{ iso_3166_1: string; name: string }>
  }
  
  /** Lo que TMDB devuelve en GET /movie/{id}/credits */
  export interface TmdbCreditsRaw {
    cast: Array<{
      id:           number
      name:         string
      character:    string
      order:        number
      profile_path: string | null
      known_for_department: string
    }>
    crew: Array<{
      id:           number
      name:         string
      job:          string
      department:   string
      profile_path: string | null
    }>
  }
  
  /** Lo que TMDB devuelve en GET /movie/{id}/watch/providers */
  export interface TmdbWatchProvidersRaw {
    results: Record<string, {          // Clave = código de país: "ES", "MX", "US"
      link: string
      flatrate?: Array<{ provider_id: number; provider_name: string; logo_path: string }>
      rent?:     Array<{ provider_id: number; provider_name: string; logo_path: string }>
      buy?:      Array<{ provider_id: number; provider_name: string; logo_path: string }>
    }>
  }
  
  /** Lo que TMDB devuelve en GET /movie/{id}/videos */
  export interface TmdbVideosRaw {
    results: Array<{
      id:           string
      key:          string             // YouTube video ID → usar como external_key
      name:         string
      site:         'YouTube' | 'Vimeo'
      type:         string             // "Trailer" | "Teaser" | "Clip" | ...
      official:     boolean
      published_at: string
      iso_639_1:    string             // Idioma: "es" | "en"
    }>
  }
  
  /** Lo que TMDB devuelve en GET /person/{id} */
  export interface TmdbPersonRaw {
    id:               number
    name:             string
    biography:        string
    birthday:         string | null
    deathday:         string | null
    place_of_birth:   string | null
    gender:           0 | 1 | 2 | 3
    popularity:       number
    profile_path:     string | null
    homepage:         string | null
    imdb_id:          string | null
    also_known_as:    string[]
    known_for_department: string
  }
  
  // ── Constantes de tamaños de imagen TMDB ────────────────────────────────────
  
  export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p' as const
  
  export const TMDB_IMAGE_SIZES = {
    poster:   ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
    backdrop: ['w300', 'w780', 'w1280', 'original'],
    profile:  ['w45', 'w185', 'h632', 'original'],
    logo:     ['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'],
  } as const
  
  export type PosterSize   = typeof TMDB_IMAGE_SIZES.poster[number]
  export type BackdropSize = typeof TMDB_IMAGE_SIZES.backdrop[number]
  export type ProfileSize  = typeof TMDB_IMAGE_SIZES.profile[number]
  
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
  export function tmdbPosterUrl(
    path: string | null | undefined,
    size: PosterSize = 'w500'
  ): string | null {
    if (!path) return null
    return `${TMDB_IMAGE_BASE}/${size}${path}`
  }
  
  /**
   * URL de backdrop (imagen de fondo panorámica).
   * Usar w1280 para desktop hero, w780 para mobile.
   */
  export function tmdbBackdropUrl(
    path: string | null | undefined,
    size: BackdropSize = 'w1280'
  ): string | null {
    if (!path) return null
    return `${TMDB_IMAGE_BASE}/${size}${path}`
  }
  
  /**
   * URL de foto de perfil de actor/director.
   */
  export function tmdbProfileUrl(
    path: string | null | undefined,
    size: ProfileSize = 'w185'
  ): string | null {
    if (!path) return null
    return `${TMDB_IMAGE_BASE}/${size}${path}`
  }
  
  // ── Transformadores: TMDB Raw → Formato interno DB ───────────────────────────
  
  /**
   * Extrae el año de una fecha de TMDB.
   * TMDB devuelve fechas como "2023-07-21"
   */
  export function extractYear(dateStr?: string): number | null {
    if (!dateStr) return null
  
    const year = Number(dateStr.split('-')[0])
  
    return Number.isNaN(year) ? null : year
  }
  
  /**
   * Convierte el tipo de video de TMDB al enum interno.
   * TMDB usa "Trailer", "Teaser", etc. con mayúscula inicial.
   */
  export function normalizeTmdbVideoType(
    tmdbType: string
  ): 'trailer' | 'teaser' | 'clip' | 'featurette' | 'behind_the_scenes' | 'bloopers' | null {
    const map: Record<string, 'trailer' | 'teaser' | 'clip' | 'featurette' | 'behind_the_scenes' | 'bloopers'> = {
      'Trailer':          'trailer',
      'Teaser':           'teaser',
      'Clip':             'clip',
      'Featurette':       'featurette',
      'Behind the Scenes':'behind_the_scenes',
      'Bloopers':         'bloopers',
    }
    return map[tmdbType] ?? null
  }
  
  /**
   * Determina si una película debe ser noindex basado en su popularidad TMDB.
   * Las películas con muy poca popularidad no merecen ser indexadas todavía.
   */
  export function shouldNoindex(tmdbPopularity: number | null | undefined): boolean {
    if (tmdbPopularity == null) return true
    return tmdbPopularity < 10
  }
  
  /**
   * Determina si una película debe ser pre-renderizada (SSG).
   * Solo las más populares justifican el costo de pre-rendering.
   */
  export function shouldPrerender(
    tmdbPopularity: number | null | undefined,
    mediaType: 'movie' | 'series' | 'documentary' | 'short' | 'special'
  ): boolean {
    if (tmdbPopularity == null) return false
    const thresholds = {
      movie:        10,   // Top ~1000 películas
      series:       8,    // Top ~500 series
      documentary:  5,
      short:        0,    // No pre-renderizar
      special:      0,
    }
    return tmdbPopularity >= thresholds[mediaType]
  }
  
  /**
   * Mapea el género TMDB al slug interno.
   * Los IDs de TMDB son estables — el seed del schema los define.
   */
  export const TMDB_GENRE_SLUG_MAP: Record<number, string> = {
    28:    'accion',
    12:    'aventura',
    16:    'animacion',
    35:    'comedia',
    80:    'crimen',
    99:    'documental',
    18:    'drama',
    10751: 'familia',
    14:    'fantasia',
    36:    'historia',
    27:    'terror',
    10402: 'musica',
    9648:  'misterio',
    10749: 'romance',
    878:   'ciencia-ficcion',
    10770: 'television',
    53:    'thriller',
    10752: 'guerra',
    37:    'western',
  }
  
  /**
   * Mapea provider_id de TMDB al slug interno de la plataforma.
   */
  export const TMDB_PROVIDER_SLUG_MAP: Record<number, string> = {
    8:   'netflix',
    119: 'prime-video',
    337: 'disney-plus',
    384: 'hbo-max',
    350: 'apple-tv-plus',
    531: 'paramount',
    619: 'star-plus',
    11:  'mubi',
    283: 'crunchyroll',
    300: 'pluto-tv',
  }
  
  /**
   * Extrae el trailer principal de una respuesta de videos TMDB.
   * Prioriza: oficial > español > inglés > cualquier trailer.
   */
  export function extractPrimaryTrailer(videos: TmdbVideosRaw['results']): TmdbVideosRaw['results'][0] | null {
    const trailers = videos.filter(v => v.type === 'Trailer' && v.site === 'YouTube')
    if (trailers.length === 0) return null
  
    // 1. Trailer oficial en español
    const officialEs = trailers.find(v => v.official && v.iso_639_1 === 'es')
    if (officialEs) return officialEs
  
    // 2. Trailer oficial en inglés
    const officialEn = trailers.find(v => v.official && v.iso_639_1 === 'en')
    if (officialEn) return officialEn
  
    // 3. Cualquier trailer oficial
    const official = trailers.find(v => v.official)
    if (official) return official
  
    // 4. El primero disponible
    return trailers[0] as any
  }