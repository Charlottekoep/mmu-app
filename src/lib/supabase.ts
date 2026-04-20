import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Browser client ────────────────────────────────────────────────────────
// Uses cookie-based session storage so the middleware can read auth state.
// isSingleton ensures one instance per browser tab.
export function getBrowserClient() {
  return createBrowserClient<Database>(url, anonKey, { isSingleton: true })
}

// ─── Server client ─────────────────────────────────────────────────────────
// Plain client for Server Components that read data (auth enforced by middleware).
export function getServerClient() {
  return createClient<Database>(url, anonKey)
}
