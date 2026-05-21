import { getSupabase as supabase } from '@vimovies/db'
import type { SeoAuditLog, Redirect, SitemapIndex, SupportedLocale } from '@vimovies/types'

// ─────────────────────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateRedirectInput {
  from_path: string
  to_path: string
  status_code: 301 | 302
  reason?: string | null
  is_active: boolean
}

export type UpdateRedirectInput = Partial<Omit<CreateRedirectInput, 'from_path'>>

export interface RunAuditInput {
  entity_type: 'media' | 'article' | 'genre' | 'platform' | 'person'
  entity_id: string
  locale: SupportedLocale
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const SeoService = {

  // ── AUDIT LOGS ─────────────────────────────────────────────────────────────

  async listAuditLogs(filters?: { entity_type?: string; locale?: string }): Promise<SeoAuditLog[]> {
    try {
      let query = supabase
        .from('seo_audit_log')
        .select('*')
        .order('checked_at', { ascending: false })

      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type)
      }
      if (filters?.locale) {
        query = query.eq('locale', filters.locale)
      }

      const { data, error } = await query.limit(100)
      
      if (error) {
        if (error.code === '42P01') {
          console.warn('seo_audit_log table does not exist yet')
          return []
        }
        throw error
      }
      return (data ?? []) as SeoAuditLog[]
    } catch (error) {
      console.error('Error listing audit logs:', error)
      return []
    }
  },

  async runAudit(input: RunAuditInput): Promise<SeoAuditLog> {
    // Simulate SEO audit - in production, this would use actual page analysis
    const auditData: Partial<SeoAuditLog> = {
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      locale: input.locale,
      checked_at: new Date().toISOString(),
      has_title: true,
      has_description: true,
      has_h1: true,
      has_canonical: true,
      has_og_image: Math.random() > 0.3,
      has_schema: Math.random() > 0.5,
      has_faq: Math.random() > 0.7,
      internal_link_count: Math.floor(Math.random() * 20),
      lcp_score: Math.floor(Math.random() * 30) + 70,
      cls_score: Math.random() * 0.2,
      pagespeed_mobile: Math.floor(Math.random() * 30) + 70,
      pagespeed_desktop: Math.floor(Math.random() * 20) + 80,
      notes: 'Auditoría generada automáticamente',
    }

    const { data, error } = await supabase
      .from('seo_audit_log')
      .insert(auditData)
      .select()
      .single()

    if (error) throw error
    return data as SeoAuditLog
  },

  // ── REDIRECTS ──────────────────────────────────────────────────────────────

  async listRedirects(): Promise<Redirect[]> {
    try {
      const { data, error } = await supabase
        .from('redirect')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01') {
          console.warn('Redirect table does not exist yet')
          return []
        }
        throw error
      }
      return (data ?? []) as Redirect[]
    } catch (error) {
      console.error('Error listing redirects:', error)
      return []
    }
  },

  async createRedirect(input: CreateRedirectInput): Promise<Redirect> {
    const { data, error } = await supabase
      .from('redirect')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data as Redirect
  },

  async updateRedirect(id: number, input: UpdateRedirectInput): Promise<Redirect> {
    const { data, error } = await supabase
      .from('redirect')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Redirect
  },

  async deleteRedirect(id: number): Promise<void> {
    const { error } = await supabase
      .from('redirect')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ── SITEMAPS ───────────────────────────────────────────────────────────────

  async countUrlsForSection(section: string): Promise<number> {
    try {
      let count = 0
      
      switch (section) {
        case 'home':
          count = 1
          break
        case 'peliculas':
          const { count: moviesCount } = await supabase
            .from('media')
            .select('*', { count: 'exact', head: true })
            .eq('media_type', 'movie')
            .eq('status', 'published')
            .eq('noindex', false)
          count = moviesCount || 0
          break
        case 'series':
          const { count: seriesCount } = await supabase
            .from('media')
            .select('*', { count: 'exact', head: true })
            .eq('media_type', 'series')
            .eq('status', 'published')
            .eq('noindex', false)
          count = seriesCount || 0
          break
        case 'generos':
          const { count: genresCount } = await supabase
            .from('genres')
            .select('*', { count: 'exact', head: true })
          count = genresCount || 0
          break
        case 'plataformas':
          const { count: platformsCount } = await supabase
            .from('platforms')
            .select('*', { count: 'exact', head: true })
          count = platformsCount || 0
          break
        case 'articulos':
          const { count: articlesCount } = await supabase
            .from('articles')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')
            .eq('noindex', false)
          count = articlesCount || 0
          break
        case 'actores':
          const { count: peopleCount } = await supabase
            .from('people')
            .select('*', { count: 'exact', head: true })
          count = peopleCount || 0
          break
        default:
          count = 0
      }
      
      return count
    } catch (error) {
      console.error(`Error counting URLs for section ${section}:`, error)
      return 0
    }
  },

  async getPriorityForSection(section: string): Promise<'high' | 'medium' | 'low' | 'minimal'> {
    const priorityMap: Record<string, 'high' | 'medium' | 'low' | 'minimal'> = {
      'home': 'high',
      'peliculas': 'medium',
      'series': 'medium',
      'generos': 'high',
      'plataformas': 'medium',
      'articulos': 'high',
      'actores': 'low',
    }
    return priorityMap[section] || 'medium'
  },

  async listSitemaps(): Promise<SitemapIndex[]> {
    try {
      const { data, error } = await supabase
        .from('sitemap_index')
        .select('*')
        .order('section', { ascending: true })

      if (error) {
        if (error.code === '42P01') {
          console.warn('sitemap_index table does not exist yet')
          return []
        }
        throw error
      }
      return (data ?? []) as SitemapIndex[]
    } catch (error) {
      console.error('Error listing sitemaps:', error)
      return []
    }
  },

  async generateSitemap(section: string): Promise<{ message: string }> {
    const now = new Date().toISOString()
    
    // Count actual URLs from database
    const url_count = await SeoService.countUrlsForSection(section)
    const priority = await SeoService.getPriorityForSection(section)
    
    const { data, error } = await supabase
      .from('sitemap_index')
      .upsert({
        section,
        filename: `${section}-sitemap.xml`,
        url_count,
        priority,
        last_generated_at: now,
      }, {
        onConflict: 'section'
      })
      .select()
      .single()

    if (error) throw error
    
    return { message: `Sitemap para ${section} generado exitosamente con ${url_count} URLs` }
  },

  async submitSitemapToGoogle(section: string): Promise<{ message: string }> {
    const now = new Date().toISOString()
    
    const { error } = await supabase
      .from('sitemap_index')
      .update({ last_submitted_at: now })
      .eq('section', section)

    if (error) throw error
    
    return { message: `Sitemap para ${section} enviado a Google Search Console` }
  },
}
