import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import ws from 'ws'

let supabaseInstance: SupabaseClient | null = null

export function initSupabase(url: string, serviceRoleKey: string) {
  supabaseInstance = createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: ws as any,
      },
    }
  )
  return supabaseInstance
}

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error('Supabase not initialized. Call initSupabase() first.')
  }
  return supabaseInstance
}