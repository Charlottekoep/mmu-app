import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cookie-aware server client for Server Components and Route Handlers.
// setAll wraps in try/catch because Server Components can read cookies but
// not write them — only Server Actions and Route Handlers can set cookies.
export async function getServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Silently ignore — cookie writes are not allowed in Server Components
        }
      },
    },
  })
}
