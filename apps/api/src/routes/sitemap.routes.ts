import { Hono } from 'hono'
import {
  buildSitemapIndex,
  buildMoviesSitemap,
  buildPeopleSitemap,
  buildGenresSitemap,
  buildArticlesSitemap,
} from '../services/sitemap.service'

const sitemapRoutes = new Hono()

// Headers comunes para todos los sitemaps
function xmlResponse(c: any, xml: string) {
  return c.body(xml, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    // Cloudflare cacheará el sitemap por 4 horas
    'Cache-Control': 'public, max-age=14400, s-maxage=14400',
    'CDN-Cache-Control': 'max-age=14400',
  })
}

sitemapRoutes.get('/sitemap.xml', async (c) => {
  const xml = await buildSitemapIndex()
  return xmlResponse(c, xml)
})

sitemapRoutes.get('/sitemap-movies/:page.xml', async (c) => {
  const pageParam = c.req.param('page')
  const page = parseInt(pageParam || '1', 10)
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

sitemapRoutes.get('/sitemap-articles.xml', async (c) => {
  const xml = await buildArticlesSitemap()
  return xmlResponse(c, xml)
})

sitemapRoutes.get('/robots.txt', (c) => {
  const siteUrl = process.env.SITE_URL ?? 'http://localhost:3002'

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

export { sitemapRoutes }
