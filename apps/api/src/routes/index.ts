import { Hono } from 'hono'
import { supabase } from '@vimovies/db'
import { buildTmdbEndpoint, TmdbEndpoint } from '@vimovies/types'
import { httpRequest, env } from '@vimovies/utils'
import { movieRoutes } from './movie.routes.js'
import { personRoutes } from './person.routes.js'
import { creditsRoutes } from './credits.routes.js'
import { mediaRoutes } from './media.routes.js'
import { articlesRoutes } from './articles.routes.js'
import { genresRoutes } from './genres.routes.js'
import { platformsRoutes } from './platforms.routes.js'
import { usersRoutes } from './users.routes.js'
import { curatedListsRoutes } from './curated-lists.routes.js'
import { authRoutes } from './auth.routes.js'
import { sitemapRoutes } from './sitemap.routes.js'
import { seoRoutes } from './seo.routes.js'
import { peopleRoutes } from './people.routes.js'
import dashboardRouter from '../controllers/dashboard.controller.js'

type Variables = {
  parsedBody?: Record<string, string>
}

const router = new Hono<{ Variables: Variables }>()

// ── Middleware para parsear application/x-www-form-urlencoded ───────────────

router.use('*', async (c, next) => {
  const contentType = c.req.header('content-type')
  
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    const body = await c.req.formData()
    const obj: Record<string, string> = {}
    body.forEach((value, key) => {
      obj[key] = value.toString()
    })
    c.set('parsedBody', obj)
  }
  
  await next()
})

// ── Health Check ───────────────────────────────────────────────────────────

router.get('/health', async (c) => {
  try {
    if (!env) {
      console.error('[Routes] env is undefined!')
      return c.json({ error: 'Environment not loaded' }, 500)
    }

    const movie = await httpRequest({
      url: buildTmdbEndpoint(TmdbEndpoint.MOVIE_DETAILS, { id: 155 }),
      baseURL: env.TMDB_BASE_URL,
      method: 'GET',
      token: env.TMDB_API_KEY,
      params: {
        append_to_response:
          'credits,videos,images,recommendations,similar,watch/providers,reviews',
        language: 'es-ES',
      },
    })

    const { error } = await supabase.auth.getSession()

    if (error) {
      return c.json(
        {
          status: 'error',
          app: 'running',
          database: 'disconnected',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        503
      )
    }

    return c.json({
      status: 'ok',
      app: 'running',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      peli: movie.data,
    })
  } catch (error) {
    return c.json(
      {
        status: 'error',
        app: 'running',
        database: 'disconnected',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      503
    )
  }
})

// ── Public Routes ──────────────────────────────────────────────────────────

router.route('/media', mediaRoutes)
router.route('/articles', articlesRoutes)
router.route('/people', peopleRoutes)
router.route('/genres', genresRoutes)
router.route('/platforms', platformsRoutes)
router.route('/lists', curatedListsRoutes)
router.route('/search', mediaRoutes) // Search endpoint

// ── User Routes ────────────────────────────────────────────────────────────

router.route('/users', usersRoutes)
router.route('/auth', authRoutes)

// ── Admin Routes ───────────────────────────────────────────────────────────

router.route('/dashboard', dashboardRouter)

router.route('/seo', seoRoutes)

// Admin routes are included in their respective route files
// e.g., /admin/media, /admin/articles, etc.

// ── TMDB Routes ────────────────────────────────────────────────────────────

router.route('/tmdb/movies', movieRoutes)
router.route('/tmdb/people', personRoutes)
router.route('/tmdb/credits', creditsRoutes)

// ── Sitemap Routes (sin prefijo /api para SEO) ─────────────────────────────

router.route('/', sitemapRoutes) // sitemap.xml, robots.txt van en raíz

export default router