# 🎬 Vimovies — Guía de Estructura, Lógica y Endpoints

> **Turborepo · Hono API · Supabase · TMDB · React**
> Este documento explica CÓMO piensa el sistema, cómo fluyen los datos,
> cómo estructurar el helper de TMDB en `packages/utils`, cómo tipar todo,
> y en qué orden construir cada módulo.

---

## 📌 Tabla de Contenidos

1. [Cómo fluyen los datos en el sistema](#-cómo-fluyen-los-datos-en-el-sistema)
2. [Módulos por prioridad de construcción](#-módulos-por-prioridad-de-construcción)
3. [packages/utils — El helper de TMDB](#-packagesutils--el-helper-de-tmdb)
4. [packages/types — Tipado compartido](#-packagestypes--tipado-compartido)
5. [Módulo 1 — Catálogo](#módulo-1--catálogo-genres--media--people)
6. [Módulo 2 — Plataformas & Streaming](#módulo-2--plataformas--streaming)
7. [Módulo 3 — Editorial](#módulo-3--editorial)
8. [Módulo 4 — Usuarios & UGC](#módulo-4--usuarios--ugc)
9. [Módulo 5 — SEO Infraestructura](#módulo-5--seo-infraestructura)
10. [Módulo 6 — Listas Curadas](#módulo-6--listas-curadas--rankings)
11. [Endpoints completos — Web & Dashboard](#-endpoints-completos--web--dashboard)
12. [Constantes del proyecto](#-constantes-del-proyecto)
13. [Convenciones que nunca se rompen](#-convenciones-que-nunca-se-rompen)

---

## 🔄 Cómo fluyen los datos en el sistema

Antes de escribir una línea de código, entender esto es fundamental. Hay **dos fuentes de datos** y cada una tiene su rol:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TMDB API (externa)                         │
│  Películas, series, actores, trailers, plataformas, ratings        │
└────────────────────────┬────────────────────────────────────────────┘
                         │  Cron job (apps/api) — cada 24h
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Supabase (nuestra DB)                         │
│  Almacena TODO lo de TMDB + enriquecimiento editorial propio       │
│  Géneros, media, people, plataformas, artículos, usuarios...       │
└──────────┬──────────────────────────────┬───────────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────┐            ┌──────────────────────┐
│   apps/api       │            │   apps/web (SSG)     │
│   Hono server    │            │   Lee de api/ o      │
│   Todos los      │◀───────────│   supabase directo   │
│   endpoints      │            │   según el caso      │
└──────────────────┘            └──────────────────────┘
           │
           ▼
┌──────────────────┐
│  apps/dashboard  │
│  CRUD completo   │
│  Solo admins     │
└──────────────────┘
```

### La regla de oro de dónde va cada cosa

| Operación | Va en... | Por qué |
|-----------|----------|---------|
| Sync TMDB → DB | `apps/api` (cron) | Requiere service role key, no exponer al cliente |
| Generar sitemaps | `apps/api` | Lógica de negocio pesada |
| Leer datos públicos (SSG) | `apps/web` → `apps/api` | Un solo punto de verdad |
| Leer datos privados (admin) | `apps/dashboard` → `apps/api` | Mismo API, con auth |
| Helper TMDB (URLs, slugs) | `packages/utils` | Código compartido, sin side effects |
| Tipos de DB | `packages/types` | Una sola fuente de verdad |
| Cliente Supabase | `packages/db` | Pre-configurado, reutilizable |
| Validación de inputs | `packages/validators` (Zod) | Shared entre API y formularios |

---

## 🏗 Módulos por prioridad de construcción

Construir en este orden exacto. Cada módulo depende del anterior.

```
FASE 0 — packages/   (sin esto, nada compila)
  ├── packages/types       ← Enums, interfaces, constantes
  ├── packages/utils       ← Helpers puros (slug, tmdb, seo, fecha)
  ├── packages/validators  ← Schemas Zod
  └── packages/db          ← Cliente Supabase tipado

FASE 1 — MÓDULO 1: CATÁLOGO  (el núcleo)
  ├── genres endpoints     ← GET /genres, GET /genres/:slug
  ├── media endpoints      ← GET /media, GET /media/:slug
  ├── people endpoints     ← GET /people/:slug
  └── Sync TMDB → DB       ← POST /admin/sync (manual trigger)

FASE 2 — MÓDULO 2: PLATAFORMAS
  ├── platforms endpoints  ← GET /platforms
  └── watch-providers      ← Incluidos en /media/:slug

FASE 3 — MÓDULO 3: EDITORIAL
  ├── authors endpoints
  ├── articles endpoints
  └── CMS básico en dashboard

FASE 4 — MÓDULO 4: USUARIOS
  ├── Auth (Supabase Auth)
  ├── watchlists endpoints
  └── reviews endpoints

FASE 5 — MÓDULO 5: SEO
  ├── sitemap endpoints
  ├── redirects
  └── audit log

FASE 6 — MÓDULO 6: LISTAS
  └── curated-lists endpoints
```

---

## 📦 packages/utils — El helper de TMDB

Este package es el más importante de todos. Es **código puro** (sin efectos secundarios, sin llamadas a APIs, sin dependencias pesadas). Todo lo que toca TMDB a nivel de transformación vive aquí.

### Estructura de archivos

```
packages/utils/src/
├── index.ts              ← Exporta todo
├── slug.utils.ts         ← generateSlug, generateMediaSlug
├── tmdb.utils.ts         ← URLs de imágenes, transformadores de datos TMDB
├── seo.utils.ts          ← Generadores de title/description por tipo de página
├── date.utils.ts         ← formatDate, formatRuntime, getYear
├── locale.utils.ts       ← getLocalized, detectLocale
└── schema.utils.ts       ← Builders de JSON-LD schemas
```

---

### `slug.utils.ts`

```typescript
// packages/utils/src/slug.utils.ts

/**
 * Genera un slug SEO-friendly desde cualquier texto.
 * Elimina acentos, caracteres especiales, convierte espacios a guiones.
 * REGLA: una vez que un slug está indexado, NUNCA cambiarlo.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')                        // Descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '')         // Elimina los diacríticos (acentos)
    .replace(/[^a-z0-9\s-]/g, '')           // Solo alfanumérico, espacios, guiones
    .trim()
    .replace(/\s+/g, '-')                   // Espacios → guión
    .replace(/-+/g, '-')                    // Guiones múltiples → uno solo
    .slice(0, 80)                           // Máximo 80 caracteres
}

/**
 * Para películas y series: agrega el año para desambiguar títulos repetidos.
 * Ejemplo: "batman" → "batman-1989" | "batman-2022"
 */
export function generateMediaSlug(title: string, year?: number | null): string {
  const base = generateSlug(title)
  return year ? `${base}-${year}` : base
}

/**
 * Para personas: usa el nombre completo.
 * Ejemplo: "Tom Hanks" → "tom-hanks"
 */
export function generatePersonSlug(name: string): string {
  return generateSlug(name)
}

// Ejemplo de uso:
// generateMediaSlug("Oppenheimer", 2023)   → "oppenheimer-2023"
// generateMediaSlug("El Señor de los Anillos", 2001) → "el-senor-de-los-anillos-2001"
// generatePersonSlug("Cillian Murphy") → "cillian-murphy"
```

---

### `tmdb.utils.ts`

Este es el helper central. Todo lo que viene de TMDB pasa por aquí antes de guardarse en la DB o usarse en la UI.

```typescript
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
export function extractYear(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const year = parseInt(dateStr.split('-')[0], 10)
  return isNaN(year) ? null : year
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
  return trailers[0]
}
```

---

### `locale.utils.ts`

```typescript
// packages/utils/src/locale.utils.ts
import type { SupportedLocale } from '@vimovies/types'

/**
 * Resuelve el campo localizado de un objeto con fallback.
 * Si no existe el campo en el idioma pedido, cae al español (idioma base).
 *
 * @example
 * getLocalized(genre, 'name', 'en')
 * → genre.name_en ?? genre.name_es ?? null
 *
 * getLocalized(article, 'title', 'en')
 * → article.title_en ?? article.title_es ?? null
 */
export function getLocalized<T extends Record<string, unknown>>(
  obj: T,
  field: string,
  locale: SupportedLocale = 'es'
): string | null | undefined {
  const localeKey   = `${field}_${locale}` as keyof T
  const fallbackKey = `${field}_es` as keyof T       // ES siempre es el fallback

  const value    = obj[localeKey]
  const fallback = obj[fallbackKey]

  return (value ?? fallback) as string | null | undefined
}

/**
 * Detecta el locale preferido desde el header Accept-Language de Hono.
 * Retorna 'en' si el header indica inglés como preferencia, 'es' en cualquier otro caso.
 *
 * @example
 * detectLocaleFromHeader("en-US,en;q=0.9,es;q=0.8") → "en"
 * detectLocaleFromHeader("es-ES,es;q=0.9")           → "es"
 */
export function detectLocaleFromHeader(acceptLanguage: string | null): SupportedLocale {
  if (!acceptLanguage) return 'es'
  const primary = acceptLanguage.split(',')[0].split('-')[0].toLowerCase()
  return primary === 'en' ? 'en' : 'es'
}
```

---

### `seo.utils.ts`

```typescript
// packages/utils/src/seo.utils.ts
import type { SupportedLocale } from '@vimovies/types'
import { getLocalized } from './locale.utils'

const SITE_NAME = 'Vimovies'

/**
 * Genera el <title> para una página de película/serie.
 * Fórmula ES: "{Título} ({Año}) — Dónde Ver y Reseña | Vimovies"
 * Fórmula EN: "{Title} ({Year}) — Where to Watch & Review | Vimovies"
 */
export function buildMediaTitle(
  media: { title_es?: string | null; title_en?: string | null; release_date?: string | null },
  locale: SupportedLocale = 'es'
): string {
  const title = getLocalized(media, 'title', locale) ?? 'Película'
  const year  = media.release_date ? media.release_date.split('-')[0] : null
  const yearStr = year ? ` (${year})` : ''

  if (locale === 'en') {
    return `${title}${yearStr} — Where to Watch & Review | ${SITE_NAME}`
  }
  return `${title}${yearStr} — Dónde Ver y Reseña | ${SITE_NAME}`
}

/**
 * Genera el <title> para una pillar page de género.
 * Fórmula ES: "Películas de {Género} — Las Mejores de {Año} | Vimovies"
 */
export function buildGenreTitle(
  genre: { name_es?: string | null; name_en?: string | null },
  locale: SupportedLocale = 'es'
): string {
  const name = getLocalized(genre, 'name', locale) ?? 'Género'
  const year = new Date().getFullYear()

  if (locale === 'en') {
    return `${name} Movies — The Best of ${year} | ${SITE_NAME}`
  }
  return `Películas de ${name} — Las Mejores de ${year} | ${SITE_NAME}`
}

/**
 * Genera el <title> para una página de actor/director.
 * Fórmula: "{Nombre} — Filmografía Completa | Vimovies"
 */
export function buildPersonTitle(name: string, locale: SupportedLocale = 'es'): string {
  if (locale === 'en') {
    return `${name} — Complete Filmography | ${SITE_NAME}`
  }
  return `${name} — Filmografía Completa | ${SITE_NAME}`
}

/**
 * Genera el <title> para una página de plataforma.
 * Fórmula ES: "Qué Ver en {Plataforma} — Catálogo Completo | Vimovies"
 */
export function buildPlatformTitle(
  platform: { name_es?: string | null; name_en?: string | null },
  locale: SupportedLocale = 'es'
): string {
  const name = getLocalized(platform, 'name', locale) ?? 'Plataforma'
  if (locale === 'en') {
    return `What to Watch on ${name} — Full Catalog | ${SITE_NAME}`
  }
  return `Qué Ver en ${name} — Catálogo Completo | ${SITE_NAME}`
}

/**
 * Trunca una descripción para usarla como meta description.
 * Respeta el límite de 160 caracteres y no corta palabras.
 */
export function truncateForMeta(text: string, maxLength = 160): string {
  if (text.length <= maxLength) return text
  const truncated = text.slice(0, maxLength - 3)
  const lastSpace = truncated.lastIndexOf(' ')
  return truncated.slice(0, lastSpace) + '...'
}
```

---

### `date.utils.ts`

```typescript
// packages/utils/src/date.utils.ts
import type { SupportedLocale } from '@vimovies/types'

/**
 * Formatea minutos de duración en texto legible.
 * @example formatRuntime(142, 'es') → "2h 22min"
 * @example formatRuntime(142, 'en') → "2h 22m"
 */
export function formatRuntime(minutes: number | null | undefined, locale: SupportedLocale = 'es'): string | null {
  if (!minutes || minutes <= 0) return null
  const h   = Math.floor(minutes / 60)
  const min = minutes % 60

  if (locale === 'en') {
    if (h === 0) return `${min}m`
    if (min === 0) return `${h}h`
    return `${h}h ${min}m`
  }
  if (h === 0) return `${min}min`
  if (min === 0) return `${h}h`
  return `${h}h ${min}min`
}

/**
 * Devuelve solo el año de una fecha ISO.
 * @example getYear("2023-07-21") → 2023
 */
export function getYear(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const year = parseInt(dateStr.split('-')[0], 10)
  return isNaN(year) ? null : year
}

/**
 * Formatea fecha ISO para mostrar en bylines de artículos.
 * @example formatDate("2024-03-15", 'es') → "15 de marzo de 2024"
 * @example formatDate("2024-03-15", 'en') → "March 15, 2024"
 */
export function formatDate(dateStr: string | null | undefined, locale: SupportedLocale = 'es'): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null

  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })
}

/**
 * Devuelve la duración en formato ISO 8601 para el schema Movie de Google.
 * @example isoRuntime(142) → "PT2H22M"
 */
export function isoRuntime(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null
  const h   = Math.floor(minutes / 60)
  const min = minutes % 60
  if (h === 0) return `PT${min}M`
  if (min === 0) return `PT${h}H`
  return `PT${h}H${min}M`
}
```

---

### `index.ts` — Exportación del package

```typescript
// packages/utils/src/index.ts

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
```

---

## 📐 packages/types — Tipado compartido

Todas las interfaces que representan filas de la DB viven aquí. Ya están definidas en `database.types.ts`. Lo que agregas además son los tipos de **request/response** de la API.

```typescript
// packages/types/src/api.types.ts

/** Estructura estándar de respuesta exitosa */
export interface ApiResponse<T> {
  data:    T
  meta?:   ApiMeta
}

/** Paginación en respuestas de listas */
export interface ApiMeta {
  page:        number
  per_page:    number
  total:       number
  total_pages: number
}

/** Estructura estándar de error */
export interface ApiError {
  error:   string   // Mensaje legible
  code?:   string   // Código interno: "NOT_FOUND", "UNAUTHORIZED"
  status:  number   // HTTP status code
}

/** Parámetros de query compartidos entre endpoints de lista */
export interface ListQueryParams {
  page?:     number           // Default: 1
  per_page?: number           // Default: 20, Max: 100
  locale?:   'es' | 'en'     // Default: 'es'
  region?:   string           // Para watch providers: 'ES', 'MX', 'AR'...
}

/** Parámetros de filtro para /media */
export interface MediaFilterParams extends ListQueryParams {
  media_type?:  'movie' | 'series' | 'documentary'
  genre_slug?:  string
  year?:        number
  sort_by?:     'popularity' | 'release_date' | 'rating'
  sort_order?:  'asc' | 'desc'
}
```

---

## Módulo 1 — Catálogo (genres / media / people)

### Qué hace este módulo

El módulo de catálogo es el núcleo del sistema. Su trabajo es:

1. **Recibir datos de TMDB** (cron job en `apps/api`)
2. **Guardarlos en Supabase** con el formato del schema
3. **Servirlos a través de la API** a `apps/web` y `apps/dashboard`

### Cómo piensa la tabla `genres`

```
genres = Géneros de películas + Pillar pages SEO

Cada fila es:
  - Un género de TMDB (tmdb_id vinculado al ID oficial de TMDB)
  - Una URL en la web: /genero/thriller, /genero/terror
  - Una página con su propio <title> y <meta description> (seo_title_es/en, seo_description_es/en)
  - Un contenido editorial (description_es/en) — texto propio que diferencia el sitio
  - Una prioridad de sitemap (sitemap_priority = 'high' por defecto)

Flujo de vida de un genre:
  SEED (manual)                         → Se inserta 1 vez con el SQL del schema
  Dashboard (editor)                    → Rellena description_es/en, seo_title_es/en
  apps/web /genero/:slug                → Lee genre + top movies de ese género
  sitemap-generos.xml                   → Lista todos los slugs
```

### Cómo piensa la tabla `media`

```
media = Película / Serie / Documental + Enriquecimiento editorial

Tiene 3 "capas" de datos:

CAPA 1 — TMDB (automático, cron job):
  tmdb_id, imdb_id, original_title, original_language
  release_date, runtime_minutes, tmdb_popularity
  title_es, title_en (TMDB devuelve la traducción)
  synopsis_es, synopsis_en
  poster_path, backdrop_path (son paths, NO URLs — usar tmdbPosterUrl())
  Ratings de TMDB → van a tabla media_ratings

CAPA 2 — SEO (semi-automático, se genera con utils):
  slug                  → generateMediaSlug(title_es, year)
  seo_title_es/en       → buildMediaTitle(media, locale)  ← se puede override en dashboard
  seo_description_es/en → truncateForMeta(synopsis_es)    ← se puede override
  og_image_url          → generado por Cloudflare Worker
  noindex               → shouldNoindex(tmdb_popularity)
  is_prerendered        → shouldPrerender(tmdb_popularity, media_type)
  sitemap_priority      → basado en popularidad

CAPA 3 — EDITORIAL (manual, desde dashboard):
  editorial_review_es/en    → Reseña propia de Vimovies (diferenciador clave)
  editorial_rating          → Nota propia 0.0-10.0
  editorial_verdict_es/en   → Tagline corto: "Una obra maestra del cine moderno"

La capa editorial es lo que hace que el sitio valga más que IMDb o FilmAffinity.
Sin ella, solo somos un mirror de TMDB.
```

### Cómo piensa `media_credits`

```
media_credits = Quién hizo qué en cada película

Una película puede tener:
  - 50 actores (role = 'actor', character_name = "Batman", cast_order = 1,2,3...)
  - 1 director (role = 'director')
  - 2 guionistas (role = 'writer')
  - 1 compositor (role = 'composer')

En la web solo mostramos los 10 primeros actores por cast_order
y todos los directores/guionistas.

La relación es: media → media_credits → people
Nunca ir de media directo a people sin pasar por media_credits.
```

### Endpoints del Módulo 1

#### Web pública (`apps/web` consume esto)

```typescript
// GET /genres
// Lista todos los géneros disponibles para el menú de navegación y homepage
// Response: ApiResponse<Genre[]>
// Query params: locale = 'es' | 'en'
// Ejemplo de uso: menú de géneros, homepage grid, selector de filtros

// GET /genres/:slug
// Pillar page de un género con sus películas top
// Response: ApiResponse<{
//   genre:  Genre,
//   movies: Media[],   // Top 20 por popularidad
//   meta:   ApiMeta
// }>
// Query params: page, per_page, locale, sort_by

// GET /media
// Lista paginada de películas/series con filtros
// Response: ApiResponse<Media[]>
// Query params: MediaFilterParams (page, per_page, media_type, genre_slug, year, sort_by, locale)
// Casos de uso: homepage trending, resultados de exploración

// GET /media/:slug
// Página completa de película — incluye TODOS los datos relacionados
// Response: ApiResponse<{
//   media:           MediaDetail,    // La película + todos sus campos
//   genres:          Genre[],
//   credits:         MediaCredit[],  // Top 10 actores + director/guionista
//   videos:          MediaVideo[],   // Trailer principal primero
//   ratings:         MediaRating[],  // TMDB, IMDB, Cinepulse
//   watch_providers: MediaWatchProvider[], // Filtrados por region
//   faqs:            ArticleFAQ[],
//   similar:         Media[],        // 6 películas similares
// }>
// Query params: locale, region (para watch providers)
// Este es el endpoint más importante del sistema

// GET /people/:slug
// Página de actor/director
// Response: ApiResponse<{
//   person:      Person,
//   as_actor:    Media[],     // Películas como actor (top 12 por popularidad)
//   as_director: Media[],     // Películas como director
// }>
// Query params: locale, page

// GET /search
// Búsqueda de películas, series y personas
// Response: ApiResponse<{ media: Media[]; people: Person[] }>
// Query params: q (string), locale, limit
// IMPORTANTE: La página /buscar es noindex — solo CSR, no SSG
```

#### Dashboard admin (`apps/dashboard` consume esto)

```typescript
// GET /admin/media
// Lista completa con filtros administrativos
// Query params: status ('draft'|'published'|'archived'), noindex, is_prerendered, page

// GET /admin/media/:id
// Detalle completo con todos los campos (incluyendo campos admin que la web no necesita)

// PATCH /admin/media/:id
// Actualiza campos editoriales de una película
// Body: {
//   editorial_review_es?: string
//   editorial_review_en?: string
//   editorial_rating?:    number      // 0.0-10.0
//   editorial_verdict_es?: string
//   editorial_verdict_en?: string
//   seo_title_es?:        string      // Override SEO title
//   seo_description_es?:  string      // Override meta description
//   status?:              ContentStatus
//   noindex?:             boolean
//   sitemap_priority?:    SitemapPriority
// }
// Nota: NUNCA se actualiza el slug desde aquí. Si cambia, crear un redirect primero.

// POST /admin/sync/media
// Dispara manualmente la sincronización con TMDB para una película
// Body: { tmdb_id: number }
// Retorna el media recién sincronizado

// POST /admin/sync/trending
// Sincroniza el top trending de TMDB con la DB
// Cron job llama a este endpoint — también puede dispararse manual desde dashboard

// GET /admin/genres
// Lista géneros con estadísticas (cuántas películas, si tiene description editorial)

// PATCH /admin/genres/:id
// Actualiza campos editoriales del género (description, seo_title, cover_image)
```

---

## Módulo 2 — Plataformas & Streaming

### Cómo piensa la tabla `platforms`

```
platforms = Netflix, Prime, Disney+, etc.

Cada plataforma es también una página SEO: /donde-ver/netflix
Con su propio título, descripción, y el catálogo disponible en esa plataforma.

Tiene dos campos de afiliado diferenciados:
  affiliate_url_es → Link de afiliado para el mercado hispanohablante
  affiliate_url_en → Link de afiliado para el mercado angloparlante

platform_type determina el modelo de negocio:
  svod = Suscripción (Netflix, Prime) → mostrar "Disponible con suscripción"
  tvod = Compra/Alquiler (Apple TV)   → mostrar precio
  avod = Gratis con ads (Pluto TV)    → mostrar "Gratis"
```

### Cómo piensa la tabla `media_watch_providers`

```
media_watch_providers = Dónde ver CADA película en CADA país

Es la tabla que responde la pregunta principal de Vimovies:
"¿Dónde puedo ver [película] en [mi país]?"

Una fila tiene:
  media_id    → La película
  platform_id → La plataforma (Netflix, etc.)
  region_code → El país donde está disponible (ES, MX, AR, CO, US)
  is_streaming → true = incluida en la suscripción
  is_rent      → true = disponible para alquilar
  is_buy       → true = disponible para comprar
  rent_price_usd, buy_price_usd → precios si aplica
  affiliate_url → Link con tag de afiliado de VIMOVIES (diferente al de la plataforma)

Ejemplo de datos reales:
  Oppenheimer | Netflix | ES | streaming=false | rent=true | buy=true | rent=$3.99
  Oppenheimer | Prime   | MX | streaming=true  | rent=false | buy=false
  Oppenheimer | Apple   | US | streaming=false | rent=true  | buy=true | rent=$5.99

Por eso el endpoint /media/:slug recibe el parámetro ?region=MX
para filtrar solo los providers de esa región.
```

### Endpoints del Módulo 2

```typescript
// GET /platforms
// Lista todas las plataformas activas, ordenadas por display_order
// Response: ApiResponse<Platform[]>
// Query params: locale

// GET /platforms/:slug
// Página de plataforma con su catálogo disponible
// Response: ApiResponse<{
//   platform: Platform,
//   movies:   Media[],   // Películas disponibles (streaming) paginadas
//   series:   Media[],
// }>
// Query params: locale, region, page, media_type

// (watch_providers se incluyen dentro de GET /media/:slug)
// No hay un endpoint separado para watch_providers

// --- DASHBOARD ---
// GET  /admin/platforms
// POST /admin/platforms                     ← Crear nueva plataforma
// PATCH /admin/platforms/:id               ← Actualizar (affiliate links, logo, etc.)
// POST /admin/sync/watch-providers/:mediaId ← Refrescar providers de una película desde TMDB
```

---

## Módulo 3 — Editorial

### Cómo piensan las tablas editoriales

```
authors → Quiénes escriben en Vimovies
  Un autor tiene: nombre, bio, avatar, twitter, expertise (señal E-E-A-T)
  El campo expertise_es es lo que aparece en el byline del artículo:
  "Escrito por Juan García, especialista en cine latinoamericano"

article_categories → Carpetas temáticas de artículos
  Están alineadas con los topic clusters del plan SEO
  Una categoría puede tener un genre_id → conecta con la pillar page
  Ejemplo: categoría "thriller" → genre_id de thriller
  Jerarquía: parent_category_id permite subcategorías
  Ejemplo: "Mejores Películas" → "Mejores Thrillers" (parent = "Mejores Películas")

articles → Los artículos editoriales
  El campo 'intent' clasifica la intención de búsqueda:
    informational → "Historia del cine noir" (tráfico general)
    transactional → "¿Está Oppenheimer en Netflix?" (alta conversión)
    navigational  → "Películas de Christopher Nolan" (búsqueda de marca)
    seasonal      → "Películas de Halloween 2024" (pico temporal)

  primary_keyword_es es la keyword objetivo. Se trackea en Google Search Console
  para medir si el artículo rankea por ella.

  word_count_es permite verificar programáticamente que se cumplen los mínimos.
  El dashboard muestra un warning si un artículo publicado tiene < 800 palabras.

article_media_mentions → Qué películas aparecen en cada artículo
  mention_type = 'primary'    → La película central del artículo
  mention_type = 'supporting' → Películas que se mencionan con detalle
  mention_type = 'mentioned'  → Solo de pasada

  Esta tabla permite:
  1. En la página de una película, mostrar "Artículos sobre esta película"
  2. En el artículo, mostrar cards de las películas mencionadas
  3. Construir el grafo de internal linking automáticamente

article_faqs → Preguntas frecuentes
  Pueden pertenecer a un artículo O a una página de película.
  Son el Schema FAQPage de Google — críticas para los rich snippets.
  Mínimo 3 por página. Se muestran visualmente al final de cada página.
```

### Endpoints del Módulo 3

```typescript
// GET /articles
// Lista artículos publicados con paginación
// Response: ApiResponse<Article[]> (sin content_es para no sobrecargar)
// Query params: locale, category_slug, intent, page, per_page

// GET /articles/:slug
// Artículo completo con todas las relaciones
// Response: ApiResponse<ArticleDetail> que incluye:
//   - article (con content_es/en)
//   - author
//   - category
//   - faqs
//   - media_mentions (con datos básicos de cada Media)
//   - tags
// Query params: locale

// GET /articles/category/:slug
// Artículos de una categoría (para páginas de topic cluster)
// Query params: locale, page

// --- DASHBOARD ---
// GET    /admin/articles                  ← Lista con filtros (status, intent, author)
// GET    /admin/articles/:id              ← Artículo completo en modo edición
// POST   /admin/articles                  ← Crear artículo (body = Article sin id/timestamps)
// PATCH  /admin/articles/:id              ← Actualizar cualquier campo
// DELETE /admin/articles/:id              ← Marcar como archived (soft delete)
// POST   /admin/articles/:id/publish      ← Cambia status → 'published', sets published_at
// GET    /admin/authors                   ← Lista autores
// POST   /admin/authors                   ← Crear autor
// PATCH  /admin/authors/:id
// GET    /admin/categories                ← Lista categorías con conteo de artículos
// POST   /admin/categories
```

---

## Módulo 4 — Usuarios & UGC

### Cómo piensa este módulo

```
users → Integrado con Supabase Auth
  El id de users es el mismo UUID que usa Supabase Auth internamente.
  locale_pref = 'es' o 'en' → determina qué idioma ve el usuario por defecto
  region_code = 'MX', 'ES', etc. → determina qué plataformas de streaming se muestran
  role:
    'viewer' → usuario normal, solo puede leer y escribir sus propias reviews/listas
    'editor' → puede crear y editar artículos desde el dashboard
    'admin'  → acceso total al dashboard, puede sincronizar TMDB, gestionar usuarios

user_reviews → Reseñas de usuarios
  Un usuario = una reseña por película (UNIQUE en user_id + media_id)
  rating de 1 a 10
  is_visible = false → moderada/reportada, no se muestra en la web
  Se usan para calcular el rating agregado de Cinepulse en media_ratings (source = 'cinepulse')

user_watchlists → Listas de películas
  Cada usuario tiene una lista por defecto (is_default = true) creada en el sign-up
  Puede crear listas adicionales
  visibility = 'public' → aparece en el perfil público del usuario (futuro)
  visibility = 'private' → solo el usuario la ve
  visibility = 'unlisted' → accesible con el link, no aparece en el perfil

user_watchlist_items → Las películas dentro de cada lista
  watched = false → está en la lista para ver
  watched = true + watched_at → ya la vio
```

### Endpoints del Módulo 4

```typescript
// Nota: estos endpoints requieren JWT de Supabase Auth en el header
// Authorization: Bearer <supabase_access_token>

// GET /users/me
// Datos del usuario autenticado (perfil + preferencias)

// PATCH /users/me
// Actualizar preferencias: locale_pref, region_code, display_name, avatar_url

// GET /users/me/watchlists
// Todas las listas del usuario autenticado (incluyendo privadas)

// POST /users/me/watchlists
// Crear nueva lista. Body: { name_es, visibility }

// PATCH /users/me/watchlists/:id
// Actualizar nombre, visibilidad

// DELETE /users/me/watchlists/:id
// Solo si no es is_default

// POST /users/me/watchlists/:id/items
// Agregar película a lista. Body: { media_id }

// DELETE /users/me/watchlists/:id/items/:mediaId
// Quitar película de lista

// PATCH /users/me/watchlists/:id/items/:mediaId
// Marcar como vista. Body: { watched: true }

// GET /users/me/reviews
// Reviews del usuario autenticado

// POST /media/:slug/reviews
// Crear o actualizar review de una película
// Body: { rating: number (1-10), body?: string }

// --- DASHBOARD ---
// GET    /admin/users                     ← Lista usuarios con filtros
// PATCH  /admin/users/:id                 ← Cambiar rol, activar/desactivar
// GET    /admin/reviews                   ← Lista reviews (con moderación pendiente)
// PATCH  /admin/reviews/:id               ← is_visible = false (moderar)
```

---

## Módulo 5 — SEO Infraestructura

### Cómo piensa este módulo

```
redirects → 301/302 cuando un slug cambia de urgencia
  Regla: NUNCA cambiar un slug sin crear el redirect aquí PRIMERO.
  El middleware de Hono lee esta tabla en cada request y sirve el redirect
  antes de llegar al controlador.
  from_path = "/pelicula/batman" (la URL vieja)
  to_path   = "/pelicula/batman-1989" (la URL nueva)

sitemap_index → Estado de cada sitemap
  El cron job actualiza last_generated_at después de regenerar.
  El dashboard muestra cuándo se generó cada sitemap y cuántas URLs tiene.
  Permite disparar manualmente la regeneración y el ping a Google.

seo_audit_log → Historial de salud SEO de cada página
  Cada vez que el cron audita una página, inserta una fila aquí.
  Permite detectar regresiones: "esta página tenía FAQ schema, ahora no lo tiene"
  pagespeed_mobile y pagespeed_desktop vienen de la PageSpeed Insights API.
```

### Endpoints del Módulo 5

```typescript
// GET /sitemap-index.xml
// El sitemap raíz que lista todos los sitemaps hijos
// Content-Type: application/xml

// GET /sitemap-home.xml
// GET /sitemap-peliculas.xml
// GET /sitemap-series.xml
// GET /sitemap-generos.xml
// GET /sitemap-actores.xml
// GET /sitemap-articulos.xml
// GET /sitemap-plataformas.xml
// Cada uno genera XML dinámico desde la DB

// GET /robots.txt
// Genera el robots.txt dinámicamente
// Bloquea: /buscar, /perfil, /admin, /api, ?page=*, ?sort=*, ?filter=*

// --- DASHBOARD ---
// GET  /admin/seo/redirects               ← Lista de redirects activos
// POST /admin/seo/redirects               ← Crear redirect
//      Body: { from_path, to_path, status_code, reason }
// PATCH /admin/seo/redirects/:id          ← Desactivar un redirect
// DELETE /admin/seo/redirects/:id

// POST /admin/seo/sitemap/regenerate      ← Fuerza regeneración de sitemaps + ping a Google
// GET  /admin/seo/sitemap/status          ← Estado de cada sitemap (last_generated, url_count)

// GET  /admin/seo/audit                   ← Últimas auditorías por entidad
// POST /admin/seo/audit/:entityType/:id   ← Disparar auditoría manual de una URL
```

---

## Módulo 6 — Listas Curadas & Rankings

### Cómo piensan estas tablas

```
curated_lists → Páginas de tipo /ranking/top-100-peliculas
  list_type:
    'ranking'     → Ordenadas con rank_position explícito (Top 100 películas)
    'collection'  → Temáticas sin orden estricto (Películas esenciales de los 80)
    'seasonal'    → Temporadas: Halloween, Navidad, San Valentín
    'thematic'    → Por tema: Películas para ver en pareja, para llorar, etc.

  is_auto_updated = true → El cron de TMDB puede actualizar la lista automáticamente
  is_auto_updated = false → Solo se actualiza manualmente desde el dashboard

curated_list_items → Las películas de cada lista
  rank_position → El orden en la lista (1, 2, 3...)
  note_es/en → Nota editorial por qué está en esa posición:
    "La mejor película de terror de los últimos 20 años"
    "Imprescindible para entender el género"
```

### Endpoints del Módulo 6

```typescript
// GET /lists
// Listas publicadas, ordenadas por popularidad/fecha
// Query params: locale, list_type, genre_slug

// GET /lists/:slug
// Lista completa con sus items y datos de cada película
// Response: ApiResponse<{
//   list:  CuratedList,
//   items: CuratedListItem & { media: Media }[]
// }>

// --- DASHBOARD ---
// GET    /admin/lists
// POST   /admin/lists                     ← Crear lista
// PATCH  /admin/lists/:id
// DELETE /admin/lists/:id
// PUT    /admin/lists/:id/items           ← Reemplazar todos los items (drag & drop reorder)
//        Body: Array<{ media_id, rank_position, note_es }>
// POST   /admin/lists/:id/items           ← Agregar película a la lista
// DELETE /admin/lists/:id/items/:mediaId  ← Quitar película
```

---

## 🔌 Endpoints completos — Web & Dashboard

### Resumen de todos los endpoints de la API

```
apps/api — BASE URL: https://api.vimovies.com/v1

PUBLIC (sin auth)
├── GET  /health
├── GET  /genres
├── GET  /genres/:slug
├── GET  /media
├── GET  /media/:slug
├── GET  /people/:slug
├── GET  /platforms
├── GET  /platforms/:slug
├── GET  /articles
├── GET  /articles/:slug
├── GET  /articles/category/:slug
├── GET  /lists
├── GET  /lists/:slug
├── GET  /search                       ?q=oppenheimer&locale=es
├── GET  /sitemap-index.xml
├── GET  /sitemap-home.xml
├── GET  /sitemap-peliculas.xml
├── GET  /sitemap-series.xml
├── GET  /sitemap-generos.xml
├── GET  /sitemap-actores.xml
├── GET  /sitemap-articulos.xml
├── GET  /sitemap-plataformas.xml
└── GET  /robots.txt

AUTHENTICATED (require JWT Supabase)
├── GET    /users/me
├── PATCH  /users/me
├── GET    /users/me/watchlists
├── POST   /users/me/watchlists
├── PATCH  /users/me/watchlists/:id
├── DELETE /users/me/watchlists/:id
├── POST   /users/me/watchlists/:id/items
├── DELETE /users/me/watchlists/:id/items/:mediaId
├── PATCH  /users/me/watchlists/:id/items/:mediaId
├── GET    /users/me/reviews
└── POST   /media/:slug/reviews

ADMIN (require JWT + role admin|editor)
├── GET    /admin/media
├── GET    /admin/media/:id
├── PATCH  /admin/media/:id
├── POST   /admin/sync/media
├── POST   /admin/sync/trending
├── POST   /admin/sync/watch-providers/:mediaId
├── GET    /admin/genres
├── PATCH  /admin/genres/:id
├── GET    /admin/platforms
├── POST   /admin/platforms
├── PATCH  /admin/platforms/:id
├── GET    /admin/articles
├── GET    /admin/articles/:id
├── POST   /admin/articles
├── PATCH  /admin/articles/:id
├── DELETE /admin/articles/:id
├── POST   /admin/articles/:id/publish
├── GET    /admin/authors
├── POST   /admin/authors
├── PATCH  /admin/authors/:id
├── GET    /admin/categories
├── POST   /admin/categories
├── GET    /admin/users
├── PATCH  /admin/users/:id
├── GET    /admin/reviews
├── PATCH  /admin/reviews/:id
├── GET    /admin/lists
├── POST   /admin/lists
├── PATCH  /admin/lists/:id
├── DELETE /admin/lists/:id
├── PUT    /admin/lists/:id/items
├── POST   /admin/lists/:id/items
├── DELETE /admin/lists/:id/items/:mediaId
├── GET    /admin/seo/redirects
├── POST   /admin/seo/redirects
├── PATCH  /admin/seo/redirects/:id
├── DELETE /admin/seo/redirects/:id
├── POST   /admin/seo/sitemap/regenerate
├── GET    /admin/seo/sitemap/status
├── GET    /admin/seo/audit
└── POST   /admin/seo/audit/:entityType/:id
```

### Ejemplo de request con Axios desde `apps/web`

```typescript
// apps/web/src/services/api.client.ts
import axios from 'axios'
import type { ApiResponse, MediaDetail, ListQueryParams } from '@vimovies/types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // https://api.vimovies.com/v1
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// Obtener una película por slug (para la página /pelicula/:slug)
export async function getMediaBySlug(
  slug: string,
  options: { locale?: 'es' | 'en'; region?: string } = {}
) {
  const { data } = await api.get<ApiResponse<MediaDetail>>(`/media/${slug}`, {
    params: {
      locale: options.locale ?? 'es',
      region: options.region ?? 'ES',
    },
  })
  return data.data
}

// Listar películas por género (para la página /genero/:slug)
export async function getMoviesByGenre(
  genreSlug: string,
  params: ListQueryParams = {}
) {
  const { data } = await api.get(`/genres/${genreSlug}`, { params })
  return data
}
```

### Ejemplo de request con Axios desde `apps/dashboard`

```typescript
// apps/dashboard/src/services/admin.client.ts
import axios from 'axios'
import { supabase } from '@vimovies/db'

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15_000,
})

// Interceptor: inyecta el JWT de Supabase en cada request
adminApi.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Actualizar review editorial de una película
export async function updateMediaEditorial(
  mediaId: string,
  body: {
    editorial_review_es?: string
    editorial_rating?:    number
    editorial_verdict_es?: string
  }
) {
  const { data } = await adminApi.patch(`/admin/media/${mediaId}`, body)
  return data
}

// Disparar sync de TMDB para una película específica
export async function syncMediaFromTmdb(tmdbId: number) {
  const { data } = await adminApi.post('/admin/sync/media', { tmdb_id: tmdbId })
  return data
}
```

---

## 🔢 Constantes del proyecto

```typescript
// packages/types/src/constants.ts

export const SITE_NAME = 'Vimovies' as const
export const SITE_URL  = 'https://www.vimovies.com' as const
export const API_URL   = 'https://api.vimovies.com/v1' as const
export const API_VERSION = 'v1' as const

// Paginación
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE     = 100

// Idiomas soportados
export const SUPPORTED_LOCALES  = ['es', 'en'] as const
export const DEFAULT_LOCALE     = 'es' as const

// Regiones para watch providers
export const SUPPORTED_REGIONS  = ['ES', 'MX', 'AR', 'CO', 'US', 'CL', 'PE'] as const
export const DEFAULT_REGION     = 'ES' as const

// TMDB
export const TMDB_BASE_URL     = 'https://api.themoviedb.org/3' as const
export const TMDB_IMAGE_BASE   = 'https://image.tmdb.org/t/p' as const
export const TMDB_SYNC_INTERVAL_HOURS = 24

// Umbrales de popularidad
export const POPULARITY_PRERENDER_THRESHOLD = 10  // Media con popularity >= 10 → pre-renderizar
export const POPULARITY_NOINDEX_THRESHOLD   = 5   // Media con popularity < 5 → noindex

// Límites SEO
export const SEO_TITLE_MAX       = 60
export const SEO_DESCRIPTION_MAX = 160
export const SEO_SLUG_MAX        = 80
export const OG_IMAGE_WIDTH      = 1200
export const OG_IMAGE_HEIGHT     = 630

// Mínimos de contenido
export const MIN_ARTICLE_WORDS   = 800
export const MIN_FAQ_COUNT       = 3
export const MIN_INTERNAL_LINKS  = 5
export const MIN_IMAGES_PER_ARTICLE = 5

// Cron jobs (intervalos en ms para node-cron o similar)
export const CRON_SYNC_TRENDING    = '0 3 * * *'   // 3am todos los días
export const CRON_SYNC_PROVIDERS   = '0 4 * * *'   // 4am todos los días
export const CRON_REGEN_SITEMAPS   = '0 5 * * *'   // 5am todos los días
export const CRON_SEO_AUDIT        = '0 6 * * 1'   // 6am cada lunes
```

---

## 📏 Convenciones que nunca se rompen

### Slugs

```
✅ Siempre con generateMediaSlug() o generatePersonSlug() — NUNCA a mano
✅ Siempre en minúsculas, sin acentos, con guiones medios
✅ NUNCA cambiar un slug indexado sin crear el redirect primero
✅ Incluir el año para películas: "oppenheimer-2023" no "oppenheimer"
```

### Imágenes de TMDB

```
✅ poster_path, backdrop_path son PATHS, no URLs completas
✅ Siempre usar tmdbPosterUrl(path, size) para construir la URL
✅ Para el LCP (hero): size = 'w1280' o 'original'
✅ Para cards y thumbnails: size = 'w342' o 'w500'
✅ Para avatares: size = 'w185'
✅ Nunca guardar URLs completas de TMDB en la DB — solo el path
```

### Respuestas de la API

```
✅ Siempre ApiResponse<T> con data y meta opcionales
✅ Errores siempre como ApiError con status, error, code
✅ Listas siempre paginadas con ApiMeta
✅ Endpoints de lista nunca devuelven campos de texto largo (content_es) — solo el listado
✅ Campos de texto largo (content_es, editorial_review_es) solo en el endpoint de detalle
```

### Internacionalización

```
✅ getLocalized(obj, 'title', locale) — nunca acceder a _es/_en directamente en la UI
✅ ES siempre es el fallback — nunca puede faltar title_es si hay title_en
✅ El locale viene del query param ?locale=en o del header Accept-Language
✅ Los slugs son únicos (no hay /en/pelicula/:slug — la URL es siempre en español)
✅ Solo el contenido cambia, nunca la URL, dependiendo del locale
```

### Dashboard vs Web

```
✅ Dashboard: SIEMPRE con JWT en el header — no hay endpoints admin sin auth
✅ Web: NUNCA exponer datos de admin (status='draft', campos internos)
✅ El campo 'status' filtra todo — la web SOLO ve status='published'
✅ noindex=true → la web no muestra esa página (aunque la DB la tenga)
```

### Orden de construcción en cada ruta de Hono

```typescript
// Orden correcto de middleware en cada route handler:
// 1. Validar auth (si es ruta protegida)
// 2. Validar body/params con Zod (packages/validators)
// 3. Consultar DB (packages/db)
// 4. Transformar datos (packages/utils)
// 5. Responder con ApiResponse<T>
```

---

*Documento generado para Vimovies · Turborepo + Hono + Supabase + TMDB*
*Actualizar cuando se agregue un nuevo módulo o endpoint*