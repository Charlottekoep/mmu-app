import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Browser client ────────────────────────────────────────────────────────
// Cookie-based session — session token included in all DB requests automatically.
// isSingleton ensures one instance per browser tab.
export function getBrowserClient() {
  return createBrowserClient<Database>(url, anonKey, { isSingleton: true })
}
