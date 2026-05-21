# 🔍 Vimovies — SEO, Sitemap & Cloudflare Workers

> Guía completa para implementar el sistema de SEO automático, generación de
> sitemaps, OG images y el proxy de imágenes TMDB via Cloudflare Workers.
>
> **Frontend: React + Vite (SPA)** - Para SEO real se requiere pre-rendering.

---

## Índice

1. [Visión general del sistema](#1-visión-general-del-sistema)
2. [Sitemap automático](#2-sitemap-automático)
3. [OG Images con Cloudflare Workers](#3-og-images-con-cloudflare-workers)
4. [Proxy de imágenes TMDB](#4-proxy-de-imágenes-tmdb)
5. [SEO en React + Vite (SPA)](#5-seo-en-react--vite-spa)
6. [JSON-LD y Schema.org](#6-json-ld-y-schemaorg)
7. [Robots.txt y headers SEO](#7-robotstxt-y-headers-seo)
8. [Estructura de archivos a crear](#8-estructura-de-archivos-a-crear)
9. [Variables de entorno necesarias](#9-variables-de-entorno-necesarias)
10. [Orden de implementación](#10-orden-de-implementación)

---

## 1. Visión general del sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLOUDFLARE (capa delante de todo)                                  │
│                                                                     │
│  Worker: images.vimovies.com  ← proxy de imágenes TMDB             │
│  Worker: og.vimovies.com      ← genera OG images dinámicas         │
│  R2 Bucket                    ← caché de OG images generadas        │
│  Cache Rules                  ← cache de sitemaps y páginas        │
│  Pages Functions (opcional)   ← pre-rendering para SEO              │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  apps/api  (Hono)                                                   │
│                                                                     │
│  GET /sitemap.xml             ← sitemap índice                      │
│  GET /sitemap-movies-{n}.xml  ← sitemaps paginados por películas    │
│  GET /sitemap-people.xml      ← sitemap de personas                 │
│  GET /sitemap-genres.xml      ← sitemap de géneros                  │
│  GET /robots.txt              ← robots dinámico                     │
│  GET /api/seo/media/:slug     ← metadatos SEO de una película       │
└─────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  apps/web  (React + Vite - SPA)                                     │
│                                                                     │
│  React Helmet / useDocumentHead  ← metatags dinámicos               │
│  <script type="application/ld+json">  ← JSON-LD por página         │
│  <link rel="canonical">       ← URL canónica                        │
│  <meta name="robots">         ← index/noindex por página            │
│                                                                     │
│  ⚠️ IMPORTANTE: SPA por defecto NO tiene SEO real.                 │
│  Para SEO real necesitas:                                            │
│  - Cloudflare Pages Functions (pre-rendering)                       │
│  - O Vite SSR (vite-plugin-ssr)                                     │
│  - O migrar a Next.js (si SEO es crítico)                           │
└─────────────────────────────────────────────────────────────────────┘
```

**Arquitectura SEO para React + Vite:**

1. **Capa de Datos (API)**: Genera sitemaps, robots.txt, metadatos SEO
2. **Capa de Edge (Cloudflare)**: Proxy imágenes, OG images, cache
3. **Capa de Pre-rendering (Opcional)**: Cloudflare Pages Functions genera HTML estático para crawlers
4. **Capa de Interactividad (React)**: SPA para usuarios con JavaScript habilitado

**La regla principal: el API genera los datos SEO, Cloudflare los entrega, React los consume.**

---

## 2. Sitemap automático

### Por qué los sitemaps son paginados

Con 3,400+ películas, un solo `sitemap.xml` sería demasiado grande.
El estándar de Google permite hasta 50,000 URLs por sitemap y 50MB sin comprimir.
La solución es un **sitemap índice** que apunta a múltiples sitemaps hijos.

```
/sitemap.xml                   ← índice (apunta a todos los demás)
/sitemap-movies-1.xml          ← URLs 1–500 de películas
/sitemap-movies-2.xml          ← URLs 501–1000
/sitemap-movies-{n}.xml        ← ...
/sitemap-people.xml            ← actores y directores
/sitemap-genres.xml            ← páginas de género
/sitemap-articles.xml          ← artículos del blog
/sitemap-lists.xml             ← listas curadas
```

### Estructura de campos necesarios en la DB

Tu tabla `media` ya tiene los campos que necesitas:
- `slug` → construye la URL: `/pelicula/{slug}`
- `sitemap_priority` → `high | medium | low | minimal`
- `noindex` → si es `true`, esta película NO va en el sitemap
- `tmdb_last_synced_at` → se usa como `lastmod` en el sitemap
- `status` → solo las `published` van al sitemap

### Archivo: `apps/api/src/services/sitemap.service.ts`

```typescript
import { supabase } from '@vimovies/db'

const SITE_URL = process.env.SITE_URL ?? 'https://vimovies.com'
const MOVIES_PER_SITEMAP = 500

// Prioridad numérica para el XML según el campo sitemap_priority
const PRIORITY_MAP: Record<string, string> = {
  high:    '0.9',
  medium:  '0.7',
  low:     '0.5',
  minimal: '0.3',
}

// Frecuencia de cambio según prioridad
const CHANGEFREQ_MAP: Record<string, string> = {
  high:    'weekly',
  medium:  'monthly',
  low:     'monthly',
  minimal: 'yearly',
}

// ── Sitemap índice ─────────────────────────────────────────────────

export async function buildSitemapIndex(): Promise<string> {
  const { count } = await supabase
    .from('media')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('noindex', false)
    .eq('media_type', 'movie')

  const totalPages = Math.ceil((count ?? 0) / MOVIES_PER_SITEMAP)
  const now = new Date().toISOString()

  const movieSitemaps = Array.from({ length: totalPages }, (_, i) =>
    `  <sitemap>
    <loc>${SITE_URL}/sitemap-movies-${i + 1}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${movieSitemaps}
  <sitemap>
    <loc>${SITE_URL}/sitemap-people.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-genres.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-articles.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`
}

// ── Sitemap de películas (paginado) ───────────────────────────────

export async function buildMoviesSitemap(page: number): Promise<string> {
  const offset = (page - 1) * MOVIES_PER_SITEMAP

  const { data: movies } = await supabase
    .from('media')
    .select('slug, sitemap_priority, tmdb_last_synced_at')
    .eq('status', 'published')
    .eq('noindex', false)
    .eq('media_type', 'movie')
    .order('tmdb_popularity', { ascending: false })
    .range(offset, offset + MOVIES_PER_SITEMAP - 1)

  if (!movies?.length) return buildEmptySitemap()

  const urls = movies.map((m) => {
    const priority  = PRIORITY_MAP[m.sitemap_priority] ?? '0.5'
    const changefreq = CHANGEFREQ_MAP[m.sitemap_priority] ?? 'monthly'
    const lastmod   = m.tmdb_last_synced_at
      ? new Date(m.tmdb_last_synced_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    return `  <url>
    <loc>${SITE_URL}/pelicula/${m.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="es" href="${SITE_URL}/pelicula/${m.slug}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/en/movie/${m.slug}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/pelicula/${m.slug}"/>
  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`
}

// ── Sitemap de personas ────────────────────────────────────────────

export async function buildPeopleSitemap(): Promise<string> {
  const { data: people } = await supabase
    .from('people')
    .select('slug, tmdb_last_synced_at, tmdb_popularity')
    .order('tmdb_popularity', { ascending: false })
    .limit(5000)

  if (!people?.length) return buildEmptySitemap()

  const urls = people.map((p) => {
    const lastmod = p.tmdb_last_synced_at
      ? new Date(p.tmdb_last_synced_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
    const priority = p.tmdb_popularity > 50 ? '0.6' : '0.4'

    return `  <url>
    <loc>${SITE_URL}/persona/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

// ── Sitemap de géneros ─────────────────────────────────────────────

export async function buildGenresSitemap(): Promise<string> {
  const { data: genres } = await supabase
    .from('genres')
    .select('slug')

  if (!genres?.length) return buildEmptySitemap()

  const urls = genres.map((g) => `  <url>
    <loc>${SITE_URL}/genero/${g.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

function buildEmptySitemap(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`
}
```

### Archivo: `apps/api/src/routes/sitemap.routes.ts`

```typescript
import { Hono } from 'hono'
import {
  buildSitemapIndex,
  buildMoviesSitemap,
  buildPeopleSitemap,
  buildGenresSitemap,
} from '../services/sitemap.service'

const sitemapRoutes = new Hono()

function xmlResponse(c: any, xml: string) {
  return c.body(xml, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=14400, s-maxage=14400',
    'CDN-Cache-Control': 'max-age=14400',
  })
}

sitemapRoutes.get('/sitemap.xml', async (c) => {
  const xml = await buildSitemapIndex()
  return xmlResponse(c, xml)
})

sitemapRoutes.get('/sitemap-movies-:page.xml', async (c) => {
  const page = parseInt(c.req.param('page'), 10)
  if (isNaN(page) || page < 1) return c.notFound()
  const xml = await buildMoviesSitemap(page)
  return xmlResponse(c, xml)
})

sitemapRoutes.get('/sitemap-people.xml', async (c) => {
  const xml = await buildPeopleSitemap()
  return xmlResponse(c, xml)
})

sitemapRoutes.get('/sitemap-genres.xml', async (c) => {
  const xml = await buildGenresSitemap()
  return xmlResponse(c, xml)
})

export { sitemapRoutes }
```

Registrar en `routes/index.ts`:
```typescript
router.route('/', sitemapRoutes) // sitemap.xml, robots.txt van en raíz
```

---

## 3. OG Images con Cloudflare Workers

### Concepto

Cuando alguien comparte `/pelicula/the-dark-knight-2008` en Twitter o WhatsApp,
el scraper busca `og:image` en el HTML. Ese tag apunta a:

```
https://og.vimovies.com/movie/the-dark-knight-2008
```

El Worker:
1. Recibe el slug
2. Llama al API para obtener datos
3. Genera imagen PNG 1200×630 usando **Satori + Resvg**
4. Guarda en R2 (caché)
5. Devuelve la imagen con cache agresivo

### Archivo: `cloudflare/workers/og-image/src/index.ts`

```typescript
// cloudflare/workers/og-image/src/index.ts
// Deploy: wrangler deploy

export interface Env {
  API_BASE_URL: string
  OG_BUCKET: R2Bucket
  TMDB_IMAGE_BASE: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const [, type, slug] = url.pathname.split('/')

    if (!slug || !['movie', 'person'].includes(type)) {
      return new Response('Not found', { status: 404 })
    }

    const cacheKey = `og/${type}/${slug}.png`

    // 1. Check R2 cache
    const cached = await env.OG_BUCKET.get(cacheKey)
    if (cached) {
      return new Response(cached.body, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=2592000, immutable',
          'X-Cache': 'HIT',
        },
      })
    }

    // 2. Fetch from API
    const apiUrl = type === 'movie'
      ? `${env.API_BASE_URL}/media/${slug}`
      : `${env.API_BASE_URL}/people/${slug}`

    const apiResponse = await fetch(apiUrl)
    if (!apiResponse.ok) return new Response('Not found', { status: 404 })

    const data = await apiResponse.json() as any
    const media = data.data

    // 3. Generate SVG with Satori
    const svg = await buildOgSvg({
      title: media.title_es ?? media.original_title,
      year: media.release_date?.split('-')[0] ?? '',
      score: media.tmdb_score ?? null,
      posterPath: media.poster_path,
      genres: media.genres ?? [],
      tmdbImageBase: env.TMDB_IMAGE_BASE,
    })

    // 4. Render SVG to PNG with Resvg
    const png = await renderSvgToPng(svg)

    // 5. Save to R2
    await env.OG_BUCKET.put(cacheKey, png, {
      httpMetadata: { contentType: 'image/png' },
    })

    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=2592000, immutable',
        'X-Cache': 'MISS',
      },
    })
  },
}

// ── Satori SVG Generation ───────────────────────────────────────

interface OgData {
  title: string
  year: string
  score: number | null
  posterPath: string | null
  genres: Array<{ name_es: string }>
  tmdbImageBase: string
}

async function buildOgSvg(data: OgData): Promise<string> {
  const satori = (await import('satori')).default
  const posterUrl = data.posterPath ? `${data.tmdbImageBase}${data.posterPath}` : null
  const scoreText = data.score ? `⭐ ${data.score.toFixed(1)}` : ''
  const genreText = data.genres.slice(0, 3).map(g => g.name_es).join(' · ')

  const svg = await satori(
    (
      <div style={{
        width: 1200, height: 630,
        background: '#0a0a0b',
        display: 'flex',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {posterUrl && (
          <img
            src={posterUrl}
            style={{
              position: 'absolute',
              left: 60, top: '50%',
              transform: 'translateY(-50%)',
              width: 200,
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            }}
          />
        )}
        <div style={{
          position: 'absolute',
          left: posterUrl ? 300 : 60,
          right: 60,
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '0 20px',
        }}>
          <div style={{
            fontSize: 14,
            color: '#e8a030',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            {genreText}
          </div>
          <div style={{
            fontSize: 52,
            fontWeight: 800,
            color: '#f0efeb',
            lineHeight: 1.1,
            marginBottom: 16,
            maxHeight: 180,
            overflow: 'hidden',
          }}>
            {data.title}
          </div>
          <div style={{
            fontSize: 22,
            color: '#9b9a96',
            marginBottom: 32,
          }}>
            {data.year}   {scoreText}
          </div>
          <div style={{
            fontSize: 18,
            color: '#5c5b57',
            fontWeight: 600,
          }}>
            vimovies.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200, height: 630,
      fonts: [{
        name: 'system-ui',
        data: await loadFont(),
        weight: 400,
        style: 'normal',
      }],
    }
  )

  return svg
}

async function renderSvgToPng(svg: string): Promise<ArrayBuffer> {
  const resvg = (await import('@resvg/resvg-wasm')).default
  const resvgJS = await resvg()
  const png = resvgJS.render(svg)
  return png.asPng()
}

async function loadFont(): Promise<ArrayBuffer> {
  const response = await fetch('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2')
  return await response.arrayBuffer()
}
```

### Invalidar caché desde dashboard

```typescript
// apps/api/src/services/og-cache.service.ts

export async function invalidateOgImage(slug: string, type: 'movie' | 'person' = 'movie') {
  const workerUrl = process.env.OG_WORKER_URL
  const secret = process.env.OG_WORKER_SECRET

  await fetch(`${workerUrl}/invalidate/${type}/${slug}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${secret}` },
  })
}
```

---

## 4. Proxy de imágenes TMDB

### Por qué proxear

- **Control total**: `images.vimovies.com/poster/w500/abc.jpg` vs `image.tmdb.org/t/p/w500/abc.jpg`
- **Caché edge**: No dependes de TMDB
- **Optimización**: Cloudflare convierte a WebP/AVIF
- **Evitar hotlinking**: Algunos TOS prohíben uso directo

### Archivo: `cloudflare/workers/images/src/index.ts`

```typescript
export interface Env {
  TMDB_BASE_URL: string
}

const ALLOWED_SIZES = {
  poster:   ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
  backdrop: ['w300', 'w780', 'w1280', 'original'],
  profile:  ['w45', 'w185', 'h632', 'original'],
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const parts = url.pathname.split('/').filter(Boolean)

    if (parts.length < 3) return new Response('Bad request', { status: 400 })

    const [imageType, size, ...pathParts] = parts
    const imagePath = '/' + pathParts.join('/')

    if (!ALLOWED_SIZES[imageType as keyof typeof ALLOWED_SIZES]) {
      return new Response('Invalid image type', { status: 400 })
    }

    const allowedSizes = ALLOWED_SIZES[imageType as keyof typeof ALLOWED_SIZES]
    if (!allowedSizes.includes(size)) {
      return new Response('Invalid size', { status: 400 })
    }

    const tmdbUrl = `${env.TMDB_BASE_URL}/${size}${imagePath}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    try {
      const tmdbResponse = await fetch(tmdbUrl, {
        signal: controller.signal,
        headers: {
          Accept: request.headers.get('Accept') ?? 'image/*',
        },
      })
      clearTimeout(timeout)

      if (!tmdbResponse.ok) return new Response('Image not found', { status: 404 })

      const contentType = tmdbResponse.headers.get('Content-Type') ?? 'image/jpeg'

      return new Response(tmdbResponse.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'CDN-Cache-Control': 'max-age=31536000',
          'X-Content-Type-Options': 'nosniff',
          'Access-Control-Allow-Origin': 'https://vimovies.com',
          'Vary': 'Accept',
        },
      })
    } catch (e) {
      clearTimeout(timeout)
      return new Response('Failed to fetch image', { status: 502 })
    }
  },
}
```

### Helper en `packages/utils/src/images.utils.ts`

```typescript
const IMAGES_BASE = import.meta.env.VITE_IMAGES_URL ?? 'https://images.vimovies.com'
const TMDB_BASE = 'https://image.tmdb.org/t/p'

export type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original'
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original'
export type ProfileSize = 'w45' | 'w185' | 'h632' | 'original'

function useProxy(): boolean {
  return import.meta.env.PROD === true
}

export function posterUrl(path: string | null, size: PosterSize = 'w500'): string | null {
  if (!path) return null
  if (useProxy()) return `${IMAGES_BASE}/poster/${size}${path}`
  return `${TMDB_BASE}/${size}${path}`
}

export function backdropUrl(path: string | null, size: BackdropSize = 'w1280'): string | null {
  if (!path) return null
  if (useProxy()) return `${IMAGES_BASE}/backdrop/${size}${path}`
  return `${TMDB_BASE}/${size}${path}`
}

export function profileUrl(path: string | null, size: ProfileSize = 'w185'): string | null {
  if (!path) return null
  if (useProxy()) return `${IMAGES_BASE}/profile/${size}${path}`
  return `${TMDB_BASE}/${size}${path}`
}
```

### Uso en React

```tsx
import { posterUrl } from '@vimovies/utils'

export function MovieCard({ movie }) {
  return (
    <img
      src={posterUrl(movie.poster_path, 'w342')}
      alt={movie.title_es}
    />
  )
}
```

---

## 5. SEO en React + Vite (SPA)

### El problema del SEO en SPAs

Las SPAs (Single Page Applications) renderizan el HTML en el cliente mediante JavaScript.
Los crawlers de Google pueden ejecutar JS, pero:
- **No es instantáneo**: Puede haber delay en el indexado
- **No todos los crawlers soportan JS**: Facebook, LinkedIn, Twitter bots pueden no ejecutarlo
- **Poor Core Web Vitals**: LCP alto por tener que cargar JS antes del contenido

### Soluciones para SEO real en React + Vite

#### Opción A: Cloudflare Pages Functions (Recomendado para este proyecto)

Genera HTML estático en el edge para crawlers, sirve SPA para usuarios:

```typescript
// cloudflare/pages/functions/pelicula/[slug].ts
export async function onRequest(context) {
  const { slug } = context.params
  
  // Fetch datos del API
  const response = await fetch(`${context.env.API_URL}/media/${slug}`)
  const media = await response.json()
  
  // Generar HTML estático con metatags
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${media.data.title_es} — Vimovies</title>
        <meta name="description" content="${media.data.synopsis_es}">
        <meta property="og:image" content="https://og.vimovies.com/movie/${slug}">
        <script type="application/ld+json">${JSON.stringify(buildSchema(media.data))}</script>
      </head>
      <body>
        <div id="root"></div>
        <script src="/assets/index.js"></script>
      </body>
    </html>
  `
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600',
    },
  })
}
```

#### Opción B: Vite SSR (vite-plugin-ssr)

Pre-rendering completo del sitio:

```bash
npm install vite-plugin-ssr
```

Configura `vite.config.ts` para pre-renderizar rutas específicas.

#### Opción C: Migrar a Next.js

Si el SEO es crítico para el negocio, considera migrar a Next.js que tiene SSR nativo.

### Implementación mínima para React + Vite (sin pre-rendering)

Mientras implementas pre-rendering, usa React Helmet para metatags dinámicos:

```bash
npm install react-helmet-async
```

```tsx
// apps/web/src/components/SEO.tsx
import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  ogImage?: string
  noindex?: boolean
  canonical?: string
}

export function SEO({ title, description, ogImage, noindex, canonical }: SEOProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {ogImage && (
        <>
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={ogImage} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content={ogImage} />
        </>
      )}
    </Helmet>
  )
}
```

```tsx
// apps/web/src/pages/MoviePage.tsx
import { SEO } from '../components/SEO'
import { useEffect, useState } from 'react'

export function MoviePage({ slug }) {
  const [media, setMedia] = useState(null)

  useEffect(() => {
    fetch(`/api/media/${slug}`)
      .then(res => res.json())
      .then(data => setMedia(data.data))
  }, [slug])

  if (!media) return <div>Loading...</div>

  return (
    <>
      <SEO
        title={`${media.title_es} (${media.release_date?.split('-')[0]}) — Vimovies`}
        description={media.synopsis_es?.slice(0, 160)}
        ogImage={`https://og.vimovies.com/movie/${slug}`}
        noindex={media.noindex}
        canonical={`https://vimovies.com/pelicula/${slug}`}
      />
      {/* ... resto del componente */}
    </>
  )
}
```

---

## 6. JSON-LD y Schema.org

### Archivo: `apps/web/src/lib/schema.ts`

```typescript
import { posterUrl } from '@vimovies/utils'

export function buildMovieSchema(media: any, locale: 'es' | 'en' = 'es') {
  const title = locale === 'es' ? media.title_es : media.title_en
  const synopsis = locale === 'es' ? media.synopsis_es : media.synopsis_en

  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: title,
    description: synopsis,
    image: posterUrl(media.poster_path, 'w500'),
    datePublished: media.release_date,
    duration: media.runtime_minutes ? `PT${media.runtime_minutes}M` : undefined,
    inLanguage: media.original_language,
    aggregateRating: media.tmdb_score ? {
      '@type': 'AggregateRating',
      ratingValue: media.tmdb_score.toFixed(1),
      bestRating: '10',
      worstRating: '0',
      ratingCount: media.tmdb_vote_count,
    } : undefined,
    genre: media.genres?.map((g: any) => locale === 'es' ? g.name_es : g.name_en),
    director: media.credits?.crew
      ?.filter((c: any) => c.role === 'director')
      .map((c: any) => ({
        '@type': 'Person',
        name: c.person.name,
        url: `https://vimovies.com/persona/${c.person.slug}`,
      })),
    actor: media.credits?.cast
      ?.slice(0, 5)
      .map((c: any) => ({
        '@type': 'Person',
        name: c.person.name,
        url: `https://vimovies.com/persona/${c.person.slug}`,
      })),
  }
}

export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
```

### Uso en React

```tsx
import { buildMovieSchema, buildBreadcrumbSchema } from '../lib/schema'

export function MoviePage({ slug, media }) {
  const schema = buildMovieSchema(media, 'es')
  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Inicio', url: 'https://vimovies.com' },
    { name: 'Películas', url: 'https://vimovies.com/peliculas' },
    { name: media.title_es, url: `https://vimovies.com/pelicula/${slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {/* ... */}
    </>
  )
}
```

---

## 7. Robots.txt y headers SEO

### Robots.txt dinámico

```typescript
// apps/api/src/routes/sitemap.routes.ts

sitemapRoutes.get('/robots.txt', (c) => {
  const siteUrl = process.env.SITE_URL ?? 'https://vimovies.com'

  const robots = `User-agent: *
Allow: /

Disallow: /dashboard/
Disallow: /api/
Disallow: /admin/

Sitemap: ${siteUrl}/sitemap.xml

User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10`

  return c.text(robots, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=86400',
  })
})
```

### Endpoint SEO para el front

```typescript
// apps/api/src/routes/media.routes.ts

mediaRoutes.get('/:slug/seo', async (c) => {
  const slug = c.req.param('slug')

  const { data, error } = await supabase
    .from('media')
    .select(`
      slug, title_es, title_en, synopsis_es, synopsis_en,
      seo_title_es, seo_title_en, seo_description_es, seo_description_en,
      poster_path, backdrop_path, release_date, noindex, status,
      tmdb_score:media_ratings(score, source),
      genres:media_genres(genre:genres(name_es, name_en, slug))
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) return c.json({ error: 'Not found' }, 404)

  return c.json({ data }, 200, {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  })
})
```

---

## 8. Estructura de archivos a crear

```
vimovies/
│
├── apps/api/src/
│   ├── services/
│   │   ├── sitemap.service.ts       ← NUEVO
│   │   └── og-cache.service.ts      ← NUEVO
│   └── routes/
│       └── sitemap.routes.ts        ← NUEVO
│
├── packages/utils/src/
│   └── images.utils.ts              ← NUEVO
│
├── apps/web/src/
│   ├── lib/
│   │   └── schema.ts               ← NUEVO
│   └── components/
│       └── SEO.tsx                 ← NUEVO (React Helmet)
│
└── cloudflare/
    └── workers/
        ├── images/                  ← NUEVO
        │   ├── src/index.ts
        │   └── wrangler.toml
        └── og-image/                ← NUEVO
            ├── src/index.ts
            └── wrangler.toml
```

### wrangler.toml para images

```toml
name = "vimovies-images"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

[images]
enabled = true
```

### wrangler.toml para og-image

```toml
name = "vimovies-og"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
API_BASE_URL = "https://api.vimovies.com"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w780"

[[r2_buckets]]
binding = "OG_BUCKET"
bucket_name = "vimovies-og-images"
```

---

## 9. Variables de entorno necesarias

### `apps/api/.env`

```bash
TMDB_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SITE_URL=https://vimovies.com
OG_WORKER_URL=https://og.vimovies.com
OG_WORKER_SECRET=tu-secret-seguro
```

### `apps/web/.env`

```bash
VITE_API_URL=https://api.vimovies.com
VITE_IMAGES_URL=https://images.vimovies.com
VITE_OG_URL=https://og.vimovies.com
```

### `cloudflare/workers/og-image/.dev.vars`

```bash
API_BASE_URL=http://localhost:3001
OG_WORKER_SECRET=dev-secret
```

---

## 10. Orden de implementación

```
FASE 1 — Sitemap (2-3 días)
  ✓ Crear sitemap.service.ts
  ✓ Crear sitemap.routes.ts y registrar
  ✓ Verificar: curl http://localhost:3001/sitemap.xml
  ✓ Agregar Cache-Control headers

FASE 2 — Proxy de imágenes (1-2 días)
  ✓ Crear cloudflare/workers/images/
  ✓ npm install -g wrangler
  ✓ wrangler dev para testear
  ✓ Crear images.utils.ts en packages/utils
  ✓ Actualizar frontend para usar posterUrl()
  ✓ wrangler deploy → images.vimovies.com

FASE 3 — OG Images (3-5 días)
  ✓ Crear cloudflare/workers/og-image/
  ✓ npm install satori @resvg/resvg-wasm
  ✓ Crear R2 bucket
  ✓ Diseñar template OG image
  ✓ wrangler deploy → og.vimovies.com
  ✓ Testear con opengraph.xyz

FASE 4 — SEO React + Vite (2-3 días)
  ✓ Instalar react-helmet-async
  ✓ Crear componente SEO.tsx
  ✓ Crear schema.ts
  ✓ Integrar en páginas principales
  ✓ Implementar Cloudflare Pages Functions (opcional, para SEO real)

FASE 5 — Robots.txt (30 minutos)
  ✓ Agregar endpoint /robots.txt
  ✓ Verificar en Google Search Console
```

### Qué NO hacer en esta fase

- No implementar SSG completo todavía (eso requiere Cloudflare Pages Functions o migración a Next.js)
- No crear sitemaps de artículos hasta tener contenido
- No instalar librerías de imágenes en el API — el procesamiento va en Workers

---

*Una vez que el sitemap esté live, ve a Google Search Console → Sitemaps y envía
`https://vimovies.com/sitemap.xml`. Google empezará a rastrear en 24-72 horas.*
