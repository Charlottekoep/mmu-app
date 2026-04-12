import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Browser client ────────────────────────────────────────────────────────
// Singleton — import getBrowserClient() in 'use client' components.
let _browser: ReturnType<typeof createClient<Database>> | null = null

export function getBrowserClient() {
  if (!_browser) _browser = createClient<Database>(url, anonKey)
  return _browser
}

// ─── Server client ─────────────────────────────────────────────────────────
// Creates a fresh client per call — safe for Server Components (RSC).
export function getServerClient() {
  return createClient<Database>(url, anonKey)
}
