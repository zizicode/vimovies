import { getSupabase as supabase } from '@vimovies/db'
import type {
  User,
  UserReview,
  UserWatchlist,
  UserWatchlistItem,
  UserRole,
  SupportedLocale,
  ListVisibility,
} from '@vimovies/types'

// ─────────────────────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Se llama cuando Supabase Auth crea un usuario nuevo.
 * El id es el mismo UUID que genera Supabase Auth — deben coincidir.
 */
export interface CreateUserInput {
  id:            string
  email:         string
  username?:     string | null
  display_name?: string | null
  avatar_url?:   string | null
  role?:         UserRole
  locale_pref?:  SupportedLocale
  region_code?:  string | null
}

/**
 * El usuario solo puede cambiar sus datos de perfil.
 * El rol y el estado los gestiona solo un admin.
 */
export interface UpdateProfileInput {
  username?:     string | null
  display_name?: string | null
  avatar_url?:   string | null
  locale_pref?:  SupportedLocale
  region_code?:  string | null
}

export interface CreateReviewInput {
  user_id:  string
  media_id: string
  rating:   number       // 1–10
  body?:    string | null
  locale?:  SupportedLocale
}

export interface CreateWatchlistInput {
  user_id:      string
  name_es:      string
  name_en?:     string | null
  description?: string | null
  visibility?:  ListVisibility
  is_default?:  boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// RETURN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface UsersListResult {
  data:  User[]
  total: number
}

export interface ReviewsListResult {
  data:  UserReview[]
  total: number
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const UsersService = {

  // ── Auth ───────────────────────────────────────────────────────────────────

  /**
   * Autentica un usuario admin usando contraseña hardcodeada
   * Retorna un token JWT si la contraseña es correcta
   * @deprecated Usa AuthService.adminLogin en su lugar
   */
  async adminLogin(password: string): Promise<{ token: string } | null> {
    const { AuthService } = await import('./auth.service.js')
    const result = await AuthService.adminLogin({ password })
    return result ? { token: result.token } : null
  },

  // ── Users ─────────────────────────────────────────────────────────────────

  /**
   * Busca un usuario por su UUID.
   * Uso: GET /users/me — perfil del usuario autenticado.
   */
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as User
  },

  /**
   * Lista paginada de usuarios para el panel de administración.
   * Uso: /admin/users
   */
  async findAll(page = 1, perPage = 30): Promise<UsersListResult> {
    const from = (page - 1) * perPage

    const { data, error, count } = await supabase
      .from('users')
      .select(
        'id, email, username, display_name, role, locale_pref, region_code, is_active, created_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, from + perPage - 1)

    if (error) throw error
    return { data: (data ?? []) as User[], total: count ?? 0 }
  },

  /**
   * Crea el perfil de usuario en la tabla users cuando Supabase Auth
   * registra un nuevo usuario. Llamar desde un webhook o trigger.
   */
  async create(input: CreateUserInput): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...input,
        role:        input.role        ?? 'viewer',
        locale_pref: input.locale_pref ?? 'es',
      })
      .select()
      .single()

    if (error) throw error
    return data as User
  },

  /**
   * Actualiza el perfil de un usuario.
   * Solo se permiten los campos de UpdateProfileInput.
   * El rol y el estado solo los puede cambiar un admin con los métodos específicos.
   */
  async updateProfile(id: string, input: UpdateProfileInput): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as User
  },

  /**
   * Cambia el rol de un usuario.
   * Solo lo puede llamar un admin.
   */
  async updateRole(id: string, role: UserRole): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as User
  },

  /**
   * Desactiva un usuario (soft delete).
   * Solo lo puede llamar un admin.
   */
  async deactivate(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as User
  },

  // ── Reviews ───────────────────────────────────────────────────────────────

  /**
   * Reviews visibles de una película, con datos del usuario.
   * Uso: sección de reseñas en la página de una película.
   */
  async findReviewsByMedia(mediaId: string, page = 1, perPage = 20): Promise<ReviewsListResult> {
    const from = (page - 1) * perPage

    const { data, error, count } = await supabase
      .from('user_reviews')
      .select(
        'id, user_id, media_id, rating, body, locale, is_visible, created_at, updated_at, users(display_name, avatar_url)',
        { count: 'exact' }
      )
      .eq('media_id', mediaId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .range(from, from + perPage - 1)

    if (error) throw error
    return { data: (data ?? []) as UserReview[], total: count ?? 0 }
  },

  /**
   * Todas las reviews de un usuario autenticado.
   * Incluye datos básicos de la película para mostrar el historial.
   */
  async findReviewsByUser(userId: string): Promise<UserReview[]> {
    const { data, error } = await supabase
      .from('user_reviews')
      .select('id, user_id, media_id, rating, body, locale, is_visible, created_at, updated_at, media(id, slug, title_es, poster_path)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as UserReview[]
  },

  /**
   * Crea o actualiza la review de un usuario para una película.
   * Un usuario solo puede tener una review por película (UNIQUE en DB).
   * Si ya existe, la actualiza con los nuevos valores.
   */
  async upsertReview(input: CreateReviewInput): Promise<UserReview> {
    const { data, error } = await supabase
      .from('user_reviews')
      .upsert(
        {
          ...input,
          locale:     input.locale ?? 'es',
          is_visible: true,
        },
        { onConflict: 'user_id,media_id' }
      )
      .select()
      .single()

    if (error) throw error
    return data as UserReview
  },

  /**
   * Modera una review: la oculta o la vuelve a mostrar.
   * Solo accesible por admins.
   */
  async moderateReview(id: string, isVisible: boolean): Promise<UserReview> {
    const { data, error } = await supabase
      .from('user_reviews')
      .update({ is_visible: isVisible })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as UserReview
  },

  /**
   * Elimina una review definitivamente.
   */
  async deleteReview(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_reviews')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ── Watchlists ────────────────────────────────────────────────────────────

  /**
   * Todas las listas de un usuario.
   * Con includePrivate = true devuelve también las privadas (solo el propio usuario).
   * Con includePrivate = false devuelve solo public y unlisted (para otros usuarios).
   */
  async findWatchlistsByUser(userId: string, includePrivate = false): Promise<UserWatchlist[]> {
    let query = supabase
      .from('user_watchlists')
      .select('id, user_id, name_es, name_en, description, visibility, is_default, created_at, updated_at')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })

    if (!includePrivate) {
      query = query.in('visibility', ['public', 'unlisted'])
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as UserWatchlist[]
  },

  /**
   * Una watchlist con todos sus items y datos básicos de cada película.
   */
  async findWatchlistById(id: string): Promise<UserWatchlist | null> {
    const { data, error } = await supabase
      .from('user_watchlists')
      .select(`
        id, user_id, name_es, name_en, description, visibility, is_default, created_at, updated_at,
        user_watchlist_items(
          added_at, watched, watched_at,
          media(id, slug, title_es, title_en, poster_path, release_date, tmdb_popularity)
        )
      `)
      .eq('id', id)
      .single()

    if (error) return null
    return data as UserWatchlist
  },

  /**
   * Crea una nueva watchlist.
   * La watchlist por defecto (is_default = true) se crea automáticamente
   * cuando el usuario se registra.
   */
  async createWatchlist(input: CreateWatchlistInput): Promise<UserWatchlist> {
    const { data, error } = await supabase
      .from('user_watchlists')
      .insert({
        ...input,
        visibility: input.visibility ?? 'private',
        is_default: input.is_default ?? false,
      })
      .select()
      .single()

    if (error) throw error
    return data as UserWatchlist
  },

  /**
   * Actualiza el nombre, descripción o visibilidad de una watchlist.
   * No se puede cambiar is_default después de creada.
   */
  async updateWatchlist(
    id:    string,
    input: Partial<Pick<CreateWatchlistInput, 'name_es' | 'name_en' | 'description' | 'visibility'>>
  ): Promise<UserWatchlist> {
    const { data, error } = await supabase
      .from('user_watchlists')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as UserWatchlist
  },

  /**
   * Elimina una watchlist y todos sus items (cascada).
   * No se puede eliminar la watchlist por defecto.
   */
  async deleteWatchlist(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_watchlists')
      .delete()
      .eq('id', id)
      .eq('is_default', false)  // Protección: no borra la lista por defecto

    if (error) throw error
  },

  /**
   * Agrega una película a una watchlist.
   * Si ya está en la lista, Supabase devuelve un error de clave duplicada.
   */
  async addToWatchlist(watchlistId: string, mediaId: string): Promise<UserWatchlistItem> {
    const { data, error } = await supabase
      .from('user_watchlist_items')
      .insert({
        watchlist_id: watchlistId,
        media_id:     mediaId,
        watched:      false,
      })
      .select()
      .single()

    if (error) throw error
    return data as UserWatchlistItem
  },

  /**
   * Quita una película de una watchlist.
   */
  async removeFromWatchlist(watchlistId: string, mediaId: string): Promise<void> {
    const { error } = await supabase
      .from('user_watchlist_items')
      .delete()
      .eq('watchlist_id', watchlistId)
      .eq('media_id', mediaId)

    if (error) throw error
  },

  /**
   * Marca o desmarca una película como vista dentro de una watchlist.
   * Si watched = true, fija watched_at a la fecha actual.
   * Si watched = false, limpia watched_at.
   */
  async markWatched(watchlistId: string, mediaId: string, watched: boolean): Promise<UserWatchlistItem> {
    const { data, error } = await supabase
      .from('user_watchlist_items')
      .update({
        watched,
        watched_at: watched ? new Date().toISOString() : null,
      })
      .eq('watchlist_id', watchlistId)
      .eq('media_id', mediaId)
      .select()
      .single()

    if (error) throw error
    return data as UserWatchlistItem
  },
}