import { supabase } from '@vimovies/db'
import type { Platform, MediaWatchProvider, PlatformType, SitemapPriority } from '@vimovies/types'

// ─────────────────────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CreatePlatformInput {
  slug:                string
  name_es:             string
  name_en:             string
  description_es?:     string | null
  description_en?:     string | null
  logo_url?:           string | null
  website_url?:        string | null
  platform_type?:      PlatformType
  seo_title_es?:       string | null
  seo_title_en?:       string | null
  seo_description_es?: string | null
  seo_description_en?: string | null
  sitemap_priority?:   SitemapPriority
  affiliate_url_es?:   string | null
  affiliate_url_en?:   string | null
  affiliate_id?:       string | null
  tmdb_provider_id?:   number | null
  is_active?:          boolean
  display_order?:      number
}

export type UpdatePlatformInput = Partial<Omit<CreatePlatformInput, 'slug'>>

/**
 * Un watch provider a insertar para una media + región.
 * media_id se agrega en syncWatchProviders.
 */
export interface WatchProviderInput {
  platform_id:     number
  region_code:     string
  is_streaming?:   boolean
  is_rent?:        boolean
  is_buy?:         boolean
  rent_price_usd?: number | null
  buy_price_usd?:  number | null
  watch_url?:      string | null
  // affiliate_url NO viene del sync — solo se agrega manualmente desde el dashboard
}

// ─────────────────────────────────────────────────────────────────────────────
// RETURN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PlatformWithCatalog {
  platform: Platform
  media:    CatalogItem[]
  total:    number
}

interface CatalogItem {
  id:              string
  slug:            string
  title_es:        string | null
  title_en:        string | null
  poster_path:     string | null
  release_date:    string | null
  tmdb_popularity: number | null
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const PlatformsService = {

  /**
   * Lista todas las plataformas, ordenadas por display_order.
   * Con onlyActive = true devuelve solo las habilitadas (uso público).
   * Con onlyActive = false devuelve todas (uso dashboard).
   */
  async findAll(onlyActive = true): Promise<Platform[]> {
    let query = supabase
      .from('platforms')
      .select('*')
      .order('display_order', { ascending: true })

    if (onlyActive) query = query.eq('is_active', true)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Platform[]
  },

  /**
   * Busca una plataforma por su slug.
   * Uso: página /donde-ver/:slug
   */
  async findBySlug(slug: string): Promise<Platform | null> {
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) return null
    return data as Platform
  },

  /**
   * Busca una plataforma por su id interno.
   * Uso: dashboard edit, referencias internas.
   */
  async findById(id: number): Promise<Platform | null> {
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Platform
  },

  /**
   * Plataforma + catálogo de películas disponibles en streaming para una región.
   * Uso: renderizar la página /donde-ver/:slug
   */
  async findBySlugWithCatalog(
    slug:    string,
    region   = 'ES',
    page     = 1,
    perPage  = 20
  ): Promise<PlatformWithCatalog | null> {
    const platform = await PlatformsService.findBySlug(slug)
    if (!platform) return null

    const from = (page - 1) * perPage

    const { data, error, count } = await supabase
      .from('media_watch_providers')
      .select(
        'media(id, slug, title_es, title_en, poster_path, release_date, tmdb_popularity)',
        { count: 'exact' }
      )
      .eq('platform_id', platform.id)
      .eq('region_code', region)
      .eq('is_streaming', true)
      .eq('media.status', 'published')
      .order('media(tmdb_popularity)', { ascending: false, nullsFirst: false })
      .range(from, from + perPage - 1)

    if (error) throw error

    return {
      platform,
      media: (data ?? []).map((r: any) => r.media).filter(Boolean) as CatalogItem[],
      total: count ?? 0,
    }
  },

  /**
   * Lista los watch providers de una media, opcionalmente filtrados por región.
   * Uso: sección "Dónde ver" dentro de la página de una película.
   */
  async findProvidersByMedia(mediaId: string, region?: string): Promise<MediaWatchProvider[]> {
    let query = supabase
      .from('media_watch_providers')
      .select(`
        id, region_code, is_streaming, is_rent, is_buy,
        rent_price_usd, buy_price_usd, watch_url, affiliate_url,
        platforms(id, slug, name_es, name_en, logo_url, platform_type, affiliate_url_es, affiliate_url_en)
      `)
      .eq('media_id', mediaId)

    if (region) query = query.eq('region_code', region)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as MediaWatchProvider[]
  },

  // ── Sync desde TMDB ───────────────────────────────────────────────────────

  /**
   * Sincroniza los watch providers de una película.
   * Borra todos los providers existentes de esa media y los reinserta.
   *
   * IMPORTANTE: affiliate_url no se toca aquí.
   * Solo se actualiza manualmente desde el dashboard con updateAffiliateUrl().
   */
  async syncWatchProviders(mediaId: string, providers: WatchProviderInput[]): Promise<void> {
    // Borrar providers anteriores de esta película
    await supabase
      .from('media_watch_providers')
      .delete()
      .eq('media_id', mediaId)

    if (!providers.length) return

    const now = new Date().toISOString()

    const { error } = await supabase
      .from('media_watch_providers')
      .insert(
        providers.map(p => ({
          ...p,
          media_id:      mediaId,
          is_streaming:  p.is_streaming  ?? false,
          is_rent:       p.is_rent       ?? false,
          is_buy:        p.is_buy        ?? false,
          tmdb_synced_at: now,
        }))
      )

    if (error) throw error
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────

  /**
   * Crea una nueva plataforma.
   * Las plataformas principales ya están en el seed SQL.
   * Este método es para agregar nuevas plataformas desde el dashboard.
   */
  async create(input: CreatePlatformInput): Promise<Platform> {
    const { data, error } = await supabase
      .from('platforms')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data as Platform
  },

  /**
   * Actualiza una plataforma existente.
   * No permite cambiar el slug.
   */
  async update(id: number, input: UpdatePlatformInput): Promise<Platform> {
    const { data, error } = await supabase
      .from('platforms')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Platform
  },

  /**
   * Actualiza solo el affiliate_url de un watch provider específico.
   * No se puede hacer desde el sync — solo desde el dashboard.
   */
  async updateAffiliateUrl(providerId: string, affiliateUrl: string): Promise<MediaWatchProvider> {
    const { data, error } = await supabase
      .from('media_watch_providers')
      .update({ affiliate_url: affiliateUrl })
      .eq('id', providerId)
      .select()
      .single()

    if (error) throw error
    return data as MediaWatchProvider
  },

  /**
   * Elimina una plataforma.
   * Cascada eliminará sus media_watch_providers.
   */
  async remove(id: number): Promise<void> {
    const { error } = await supabase
      .from('platforms')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
