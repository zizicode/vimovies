import { supabase } from '@vimovies/db'
import type { Author } from '@vimovies/types'

// ─────────────────────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateAuthorInput {
  slug:            string
  display_name:    string
  email:           string
  bio_es?:         string | null
  bio_en?:         string | null
  avatar_url?:     string | null
  twitter_handle?: string | null
  website_url?:    string | null
  expertise_es?:   string | null
  expertise_en?:   string | null
  is_active?:      boolean
}

// El email no se puede cambiar una vez creado
export type UpdateAuthorInput = Partial<Omit<CreateAuthorInput, 'email' | 'slug'>>

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const AuthorsService = {

  /**
   * Lista todos los autores.
   * Con onlyActive = true devuelve solo los activos (uso público, bylines).
   * Con onlyActive = false devuelve todos (dashboard).
   */
  async findAll(onlyActive = true): Promise<Author[]> {
    let query = supabase
      .from('authors')
      .select('id, slug, display_name, avatar_url, expertise_es, expertise_en, twitter_handle, is_active, created_at')
      .order('display_name', { ascending: true })

    if (onlyActive) query = query.eq('is_active', true)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Author[]
  },

  /**
   * Busca un autor por su slug.
   * Uso: página de autor /autor/:slug, byline en artículos.
   */
  async findBySlug(slug: string): Promise<Author | null> {
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) return null
    return data as Author
  },

  /**
   * Busca un autor por su UUID.
   * Uso: dashboard edit, referencias internas.
   */
  async findById(id: string): Promise<Author | null> {
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Author
  },

  /**
   * Crea un nuevo autor.
   * El slug debe generarse con generateSlug(display_name) antes de llamar aquí.
   */
  async create(input: CreateAuthorInput): Promise<Author> {
    const { data, error } = await supabase
      .from('authors')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data as Author
  },

  /**
   * Actualiza los datos de un autor.
   * No permite cambiar el slug ni el email.
   */
  async update(id: string, input: UpdateAuthorInput): Promise<Author> {
    const { data, error } = await supabase
      .from('authors')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Author
  },

  /**
   * Desactiva un autor (soft delete).
   * Sus artículos permanecen publicados con el byline existente.
   * Se prefiere desactivar antes que eliminar para preservar la integridad editorial.
   */
  async deactivate(id: string): Promise<Author> {
    const { data, error } = await supabase
      .from('authors')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Author
  },
}