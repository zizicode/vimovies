import { Hono } from 'hono'
import { SeoController } from '../controllers/seo.controller'
import { createAuthMiddleware } from '@vimovies/utils'

export const seoRoutes = new Hono()

// Apply auth middleware to all SEO routes
seoRoutes.use('/*', createAuthMiddleware('admin'))

// ── AUDIT LOGS ─────────────────────────────────────────────────────────────

// GET /api/seo/audit-logs
seoRoutes.get('/audit-logs', SeoController.listAuditLogs)

// POST /api/seo/audit
seoRoutes.post('/audit', SeoController.runAudit)

// ── REDIRECTS ──────────────────────────────────────────────────────────────

// GET /api/seo/redirects
seoRoutes.get('/redirects', SeoController.listRedirects)

// POST /api/seo/redirects
seoRoutes.post('/redirects', SeoController.createRedirect)

// PATCH /api/seo/redirects/:id
seoRoutes.patch('/redirects/:id', SeoController.updateRedirect)

// DELETE /api/seo/redirects/:id
seoRoutes.delete('/redirects/:id', SeoController.deleteRedirect)

// ── SITEMAPS ───────────────────────────────────────────────────────────────

// GET /api/seo/sitemaps
seoRoutes.get('/sitemaps', SeoController.listSitemaps)

// POST /api/seo/sitemaps/generate
seoRoutes.post('/sitemaps/generate', SeoController.generateSitemap)

// POST /api/seo/sitemaps/submit
seoRoutes.post('/sitemaps/submit', SeoController.submitSitemap)
