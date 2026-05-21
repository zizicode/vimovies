import type { Context } from 'hono'
import { SeoService } from '../services/seo.service'
import { ok, serverError, notFound } from '@vimovies/utils'

export const SeoController = {

  // ── AUDIT LOGS ─────────────────────────────────────────────────────────────

  // GET /api/seo/audit-logs
  async listAuditLogs(c: Context) {
    try {
      const entity_type = c.req.query('entity_type')
      const locale = c.req.query('locale')
      const data = await SeoService.listAuditLogs({ 
        ...(entity_type && { entity_type }), 
        ...(locale && { locale }) 
      })
      return ok(c, data)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /api/seo/audit
  async runAudit(c: Context) {
    try {
      const body = await c.req.json()
      const data = await SeoService.runAudit(body)
      return ok(c, data, 201)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // ── REDIRECTS ──────────────────────────────────────────────────────────────

  // GET /api/seo/redirects
  async listRedirects(c: Context) {
    try {
      const data = await SeoService.listRedirects()
      return ok(c, data)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /api/seo/redirects
  async createRedirect(c: Context) {
    try {
      const body = await c.req.json()
      const data = await SeoService.createRedirect(body)
      return ok(c, data, 201)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // PATCH /api/seo/redirects/:id
  async updateRedirect(c: Context) {
    try {
      const id = Number(c.req.param('id'))
      const body = await c.req.json()
      const data = await SeoService.updateRedirect(id, body)
      return ok(c, data)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // DELETE /api/seo/redirects/:id
  async deleteRedirect(c: Context) {
    try {
      const id = Number(c.req.param('id'))
      await SeoService.deleteRedirect(id)
      return ok(c, { message: 'Redirección eliminada' })
    } catch (err) {
      return serverError(c, err)
    }
  },

  // ── SITEMAPS ───────────────────────────────────────────────────────────────

  // GET /api/seo/sitemaps
  async listSitemaps(c: Context) {
    try {
      const data = await SeoService.listSitemaps()
      return ok(c, data)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /api/seo/sitemaps/generate
  async generateSitemap(c: Context) {
    try {
      const body = await c.req.json()
      const data = await SeoService.generateSitemap(body.section)
      return ok(c, data)
    } catch (err) {
      return serverError(c, err)
    }
  },

  // POST /api/seo/sitemaps/submit
  async submitSitemap(c: Context) {
    try {
      const body = await c.req.json()
      const data = await SeoService.submitSitemapToGoogle(body.section)
      return ok(c, data)
    } catch (err) {
      return serverError(c, err)
    }
  },
}
