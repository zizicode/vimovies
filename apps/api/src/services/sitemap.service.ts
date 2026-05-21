import { supabase } from '@vimovies/db'

const SITE_URL = process.env.SITE_URL ?? 'https://vimovies.com'
const MOVIES_PER_SITEMAP = 500

// Prioridad numérica para el XML según el campo sitemap_priority
const PRIORITY_MAP: Record<string, string> = {
  high: '0.9',
  medium: '0.7',
  low: '0.5',
  minimal: '0.3',
}

// Frecuencia de cambio según prioridad
const CHANGEFREQ_MAP: Record<string, string> = {
  high: 'weekly',
  medium: 'monthly',
  low: 'monthly',
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
    <loc>${SITE_URL}/sitemap-movies/${i + 1}.xml</loc>
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
    const priority = PRIORITY_MAP[m.sitemap_priority] ?? '0.5'
    const changefreq = CHANGEFREQ_MAP[m.sitemap_priority] ?? 'monthly'
    const lastmod = m.tmdb_last_synced_at
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

// ── Sitemap de artículos ────────────────────────────────────────────

export async function buildArticlesSitemap(): Promise<string> {
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(500)

  if (!articles?.length) return buildEmptySitemap()

  const urls = articles.map((a) => {
    const lastmod = a.published_at
      ? new Date(a.published_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    return `  <url>
    <loc>${SITE_URL}/articulo/${a.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

// ── Helper ─────────────────────────────────────────────────────────

function buildEmptySitemap(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`
}
