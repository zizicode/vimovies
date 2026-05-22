import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import ws from 'ws'
import { env } from './env.js'

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
    supabaseInstance = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
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
  }
  return supabaseInstance
}

// Export a default client that auto-initializes
export const supabase = getSupabase()