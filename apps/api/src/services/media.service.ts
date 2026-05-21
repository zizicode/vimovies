import { supabase } from '@vimovies/db'
import type {
  Media,
  MediaDetail,
  MediaType,
  ContentStatus,
  SitemapPriority,
  RatingSource,
  MediaVideo,
  MediaRating,
  VideoType,
  VideoSite,
  SupportedLocale,
} from '@vimovies/types'

// ─────────────────────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface MediaFilters {
  page?:       number
  per_page?:   number
  media_type?: MediaType
  status?:     ContentStatus
  noindex?:    boolean
  search?:     string
  genre_id?:   number
  sort_by?:    'tmdb_popularity' | 'release_date' | 'editorial_rating'
  sort_order?: 'asc' | 'desc'
}

/**
 * Campos que llegan del sync de TMDB.
 * El slug lo genera generateMediaSlug() antes de llamar a este service.
 */
export interface UpsertMediaInput {
  tmdb_id:              number
  slug:                 string
  media_type:           MediaType
  original_title:       string
  original_language:    string
  title_es?:            string | null
  title_en?:            string | null
  synopsis_es?:         string | null
  synopsis_en?:         string | null
  release_date?:        string | null
  runtime_minutes?:     number | null
  tmdb_popularity?:     number | null
  poster_path?:         string | null
  backdrop_path?:       string | null
  imdb_id?:             string | null
  noindex?:             boolean
  is_prerendered?:      boolean
  sitemap_priority?:    SitemapPriority
  status?:              ContentStatus
  tmdb_last_synced_at?: string | null
}

/**
 * Campos que solo el dashboard puede modificar.
 * El sync de TMDB nunca toca ninguno de estos.
 */
export interface UpdateEditorialInput {
  editorial_review_es?:  string | null
  editorial_review_en?:  string | null
  editorial_rating?:     number | null
  editorial_verdict_es?: string | null
  editorial_verdict_en?: string | null
  seo_title_es?:         string | null
  seo_title_en?:         string | null
  seo_description_es?:   string | null
  seo_description_en?:   string | null
  og_image_url?:         string | null
  status?:               ContentStatus
  noindex?:              boolean
  sitemap_priority?:     SitemapPriority
}

/**
 * Actualización parcial de campos individuales (admin only).
 * Permite editar cualquier campo de media sin enviar todo el objeto.
 */
export interface PatchMediaInput {
  title_es?:             string | null
  title_en?:             string | null
  synopsis_es?:          string | null
  synopsis_en?:          string | null
  editorial_review_es?:  string | null
  editorial_review_en?:  string | null
  editorial_rating?:     number | null
  editorial_verdict_es?: string | null
  editorial_verdict_en?: string | null
  poster_path?:          string | null
  backdrop_path?:        string | null
  logo_path?:            string | null
  seo_title_es?:         string | null
  seo_title_en?:         string | null
  seo_description_es?:   string | null
  seo_description_en?:   string | null
  og_image_url?:         string | null
  status?:               ContentStatus
  noindex?:              boolean
  is_prerendered?:       boolean
  sitemap_priority?:     SitemapPriority
  canonical_url_es?:     string | null
  canonical_url_en?:     string | null
}

export interface UpsertRatingInput {
  media_id:   string
  source:     RatingSource
  score:      number
  vote_count?: number | null
  raw_score?:  string | null
}

export interface SyncVideoInput {
  locale:       SupportedLocale
  video_type:   VideoType
  video_site:   VideoSite
  external_key: string
  title?:       string | null
  published_at?: string | null
  is_official:  boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// RETURN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface MediaListResult {
  data:  Media[]
  total: number
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const MediaService = {

  /**
   * Lista paginada de películas/series para la web pública.
   * Por defecto: publicadas, ordenadas por popularidad descendente.
   */
  async findAll(filters: MediaFilters = {}): Promise<MediaListResult> {
    const {
      page       = 1,
      per_page   = 20,
      media_type,
      status,
      noindex,
      search,
      genre_id,
      sort_by    = 'tmdb_popularity',
      sort_order = 'desc',
    } = filters

    const from = (page - 1) * per_page
    const to   = from + per_page - 1

    // If filtering by genre, use a different query approach
    if (genre_id) {
      // First get all media IDs that have this genre
      const { data: genreRelations, error: genreError } = await supabase
        .from('media_genres')
        .select('media_id')
        .eq('genre_id', genre_id)
      
      if (genreError) throw genreError
      
      const mediaIds = genreRelations?.map((r: any) => r.media_id) || []
      
      if (mediaIds.length === 0) {
        return { data: [], total: 0 }
      }

      // Now get the media with those IDs
      let query = supabase
        .from('media')
        .select(
          'id, tmdb_id, imdb_id, slug, media_type, original_title, original_language, release_date, runtime_minutes, tmdb_popularity, title_es, title_en, synopsis_es, synopsis_en, editorial_review_es, editorial_review_en, editorial_rating, editorial_verdict_es, editorial_verdict_en, poster_path, backdrop_path, logo_path, seo_title_es, seo_title_en, seo_description_es, seo_description_en, og_image_url, status, is_prerendered, sitemap_priority, noindex, tmdb_last_synced_at, created_at, updated_at, media_genres(genre_id)',
          { count: 'exact' }
        )
        .in('id', mediaIds)

      if (status) query = query.eq('status', status)
      if (media_type) query = query.eq('media_type', media_type)
      if (noindex !== undefined) query = query.eq('noindex', noindex)
      
      // Search filter
      if (search) {
        query = query.or(`title_es.ilike.%${search}%,title_en.ilike.%${search}%,original_title.ilike.%${search}%`)
      }
      
      // Don't apply pagination yet - get all results first, then sort and paginate
      const { data, error, count } = await query
      if (error) throw error

      let transformedData = (data ?? []).map((media: any) => ({
        ...media,
        genre_ids: media.media_genres?.map((mg: any) => mg.genre_id) || [],
        media_genres: undefined,
      }))

      // Sort in JavaScript
      transformedData.sort((a: any, b: any) => {
        let aVal: any, bVal: any;
        
        switch (sort_by) {
          case 'tmdb_popularity':
            aVal = a.tmdb_popularity || 0;
            bVal = b.tmdb_popularity || 0;
            break;
          case 'release_date':
            aVal = a.release_date || '';
            bVal = b.release_date || '';
            break;
          case 'editorial_rating':
            aVal = a.editorial_rating || 0;
            bVal = b.editorial_rating || 0;
            break;
          default:
            return 0;
        }
        
        if (sort_order === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      // Apply pagination after sorting
      const paginatedData = transformedData.slice(from, to + 1);

      return { data: paginatedData as Media[], total: count ?? 0 }
    }

    // Regular query without genre filter
    let query = supabase
      .from('media')
      .select(
        'id, tmdb_id, imdb_id, slug, media_type, original_title, original_language, release_date, runtime_minutes, tmdb_popularity, title_es, title_en, synopsis_es, synopsis_en, editorial_review_es, editorial_review_en, editorial_rating, editorial_verdict_es, editorial_verdict_en, poster_path, backdrop_path, logo_path, seo_title_es, seo_title_en, seo_description_es, seo_description_en, og_image_url, status, is_prerendered, sitemap_priority, noindex, tmdb_last_synced_at, created_at, updated_at, media_genres(genre_id)',
        { count: 'exact' }
      )
      .order(sort_by, { ascending: sort_order === 'asc', nullsFirst: false })

    if (status)                query = query.eq('status', status)
    if (media_type)            query = query.eq('media_type', media_type)
    if (noindex !== undefined) query = query.eq('noindex', noindex)
    
    // Search filter (search in title_es, title_en, or original_title)
    if (search) {
      query = query.or(`title_es.ilike.%${search}%,title_en.ilike.%${search}%,original_title.ilike.%${search}%`)
    }
    
    // Apply pagination after filters
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw error

    // Transform media_genres to genre_ids array
    const transformedData = (data ?? []).map((media: any) => ({
      ...media,
      genre_ids: media.media_genres?.map((mg: any) => mg.genre_id) || [],
      media_genres: undefined, // Remove the nested structure
    }))

    return { data: transformedData as Media[], total: count ?? 0 }
  },

  /**
   * Busca una media por su slug.
   * Uso: cualquier resolución interna de slug → entidad.
   */
  async findBySlug(slug: string): Promise<Media | null> {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) return null
    return data as Media
  },

  /**
   * Busca una media por su UUID interno.
   * Uso: referencias internas, dashboard edit.
   */
  async findById(id: string): Promise<Media | null> {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Media
  },

  /**
   * Página completa de una película: todos los datos relacionados en una sola llamada.
   * Uso: renderizar /pelicula/:slug o /serie/:slug
   *
   * Carga en paralelo: géneros, créditos, videos, ratings, providers y FAQs.
   * El parámetro region filtra los watch providers por país (ES, MX, AR, CO, US).
   */
  async findBySlugFull(slug: string, region = 'ES'): Promise<MediaDetail | null> {
    const media = await MediaService.findBySlug(slug)
    if (!media) return null

    const [
      { data: genres },
      { data: credits },
      { data: videos },
      { data: ratings },
      { data: providers },
      { data: faqs },
    ] = await Promise.all([
      supabase
        .from('media_genres')
        .select('genres(id, slug, name_es, name_en, sitemap_priority)')
        .eq('media_id', media.id),

      supabase
        .from('media_credits')
        .select(`
          id, media_id, person_id, role, character_name, cast_order, department, job_title,
          person:people(id, tmdb_id, slug, name, profile_path, tmdb_popularity, gender, sitemap_priority, created_at, updated_at)
        `)
        .eq('media_id', media.id)
        .order('cast_order', { ascending: true, nullsFirst: false }),

      supabase
        .from('media_videos')
        .select('id, media_id, locale, video_type, video_site, external_key, title, published_at, is_official')
        .eq('media_id', media.id)
        .order('is_official', { ascending: false }),

      supabase
        .from('media_ratings')
        .select('media_id, source, score, vote_count, raw_score, fetched_at')
        .eq('media_id', media.id),

      supabase
        .from('media_watch_providers')
        .select(`
          id, media_id, platform_id, region_code, is_streaming, is_rent, is_buy,
          rent_price_usd, buy_price_usd, watch_url, affiliate_url,
          platform:platforms(id, slug, name_es, name_en, logo_url, platform_type, affiliate_url_es, affiliate_url_en)
        `)
        .eq('media_id', media.id)
        .eq('region_code', region),

      supabase
        .from('article_faqs')
        .select('id, question_es, question_en, answer_es, answer_en, display_order')
        .eq('media_id', media.id)
        .order('display_order', { ascending: true }),
    ])

    return {
      ...media,
      genres:          (genres  ?? []).map((g: any) => g.genres).filter(Boolean),
      credits:         (credits ?? []).map((c: any) => ({
        ...c,
        person: c.person?.[0]
      })),
      videos:          (videos  ?? []) as MediaVideo[],
      ratings:         (ratings ?? []) as MediaRating[],
      watch_providers: (providers ?? []).map((p: any) => ({
        id: p.id,
        media_id: p.media_id,
        platform_id: p.platform_id,
        region_code: p.region_code,
        is_streaming: p.is_streaming,
        is_rent: p.is_rent,
        is_buy: p.is_buy,
        rent_price_usd: p.rent_price_usd,
        buy_price_usd: p.buy_price_usd,
        watch_url: p.watch_url,
        affiliate_url: p.affiliate_url,
        tmdb_synced_at: p.tmdb_synced_at,
        verified_at: p.verified_at,
        platform: p.platform?.[0],
      })),
      faqs:            faqs     ?? [],
    } as MediaDetail
  },

  /**
   * Películas de un género específico paginadas.
   * Uso: sección de películas dentro de /genero/:slug
   */
  async findByGenre(genreSlug: string, page = 1, perPage = 20): Promise<MediaListResult> {
    const from = (page - 1) * perPage

    const { data: genre } = await supabase
      .from('genres')
      .select('id')
      .eq('slug', genreSlug)
      .single()

    if (!genre) return { data: [], total: 0 }

    const { data, error, count } = await supabase
      .from('media_genres')
      .select(
        'media(id, slug, title_es, title_en, poster_path, release_date, tmdb_popularity, editorial_rating)',
        { count: 'exact' }
      )
      .eq('genre_id', (genre as any).id)
      .eq('media.status', 'published')
      .order('media(tmdb_popularity)', { ascending: false })
      .range(from, from + perPage - 1)

    if (error) throw error
    return {
      data:  (data ?? []).map((r: any) => r.media).filter(Boolean) as Media[],
      total: count ?? 0,
    }
  },

  /**
   * Búsqueda de texto sobre títulos.
   * Usa ilike (case-insensitive LIKE). Para producción con pg_trgm
   * se puede cambiar a textSearch para mejor rendimiento.
   */
  async search(q: string, limit = 10): Promise<Media[]> {
    const { data, error } = await supabase
      .from('media')
      .select('id, slug, title_es, title_en, poster_path, release_date, media_type, tmdb_popularity')
      .or(`title_es.ilike.%${q}%,title_en.ilike.%${q}%,original_title.ilike.%${q}%`)
      .eq('status', 'published')
      .order('tmdb_popularity', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (error) throw error
    return (data ?? []) as Media[]
  },

  // ── Sync desde TMDB ───────────────────────────────────────────────────────

  /**
   * Inserta o actualiza una película desde el sync de TMDB.
   * Usa onConflict: 'tmdb_id' — si ya existe ese tmdb_id, actualiza.
   * Devuelve el id y slug de la fila guardada.
   */
  async upsertFromSync(input: UpsertMediaInput): Promise<{ id: string; slug: string }> {
    const { data, error } = await supabase
      .from('media')
      .upsert(input, { onConflict: 'tmdb_id' })
      .select('id, slug')
      .single()

    if (error) throw error
    return data as { id: string; slug: string }
  },

  /**
   * Sincroniza los géneros de una película.
   * Borra los existentes y los reinserta para evitar duplicados.
   */
  async syncGenres(mediaId: string, tmdbGenreIds: number[]): Promise<void> {
    // 1. Buscar los id internos de los géneros por su tmdb_id
    const { data: genres, error: genresError } = await supabase
      .from('genres')
      .select('id, tmdb_id')
      .in('tmdb_id', tmdbGenreIds)

    if (genresError) throw genresError

    // 2. Borrar relaciones actuales
    await supabase.from('media_genres').delete().eq('media_id', mediaId)

    if (!genres || !genres.length) return

    // 3. Insertar las nuevas relaciones
    const { error } = await supabase
      .from('media_genres')
      .insert(genres.map((g: any) => ({ media_id: mediaId, genre_id: g.id })))

    if (error) throw error
  },

  /**
   * Sincroniza los videos (trailers) de una película.
   * Borra los existentes y los reinserta.
   */
  async syncVideos(mediaId: string, videos: SyncVideoInput[]): Promise<void> {
    await supabase.from('media_videos').delete().eq('media_id', mediaId)
    if (!videos.length) return

    const { error } = await supabase
      .from('media_videos')
      .insert(videos.map(v => ({ ...v, media_id: mediaId })))

    if (error) throw error
  },

  /**
   * Inserta o actualiza el rating de una fuente específica (tmdb, imdb...).
   * La clave de conflicto es (media_id, source).
   */
  async upsertRating(input: UpsertRatingInput): Promise<void> {
    const { error } = await supabase
      .from('media_ratings')
      .upsert(
        { ...input, fetched_at: new Date().toISOString() },
        { onConflict: 'media_id,source' }
      )

    if (error) throw error
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────

  /**
   * Actualiza solo los campos editoriales de una película.
   * El sync de TMDB NUNCA llama a este método.
   */
  async updateEditorial(id: string, input: UpdateEditorialInput): Promise<Media> {
    const { data, error } = await supabase
      .from('media')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Media
  },

  /**
   * Actualización parcial de campos individuales (admin only).
   * Permite editar cualquier campo sin enviar todo el objeto.
   * Uso: PATCH /api/admin/media/:id con solo los campos a modificar.
   */
  async patch(id: string, input: PatchMediaInput): Promise<Media> {
    const { data, error } = await supabase
      .from('media')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Media
  },

  /**
   * Elimina una película de la base de datos.
   * Cascada eliminará media_genres, media_credits, media_videos,
   * media_ratings, media_watch_providers y article_faqs asociadas.
   */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}