// apps/api/src/app.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { env } from '@vimovies/utils'
import routes from './routes/index.js'
import { sitemapRoutes } from './routes/sitemap.routes.js'

export const app = new Hono()
  .use('*', logger())
  .use('*', secureHeaders())
  .use('*', cors({
    origin: [env.WEB_URL, env.DASHBOARD_URL],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }))
  .use('*', prettyJSON())

// Montar todas las rutas
app.route('/', sitemapRoutes)

// Montar todas las rutas
app.route('/api', routes)

export type AppType = typeof app