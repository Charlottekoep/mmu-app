'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase'

// Routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/auth/callback']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p))
}

// ─── Context ──────────────────────────────────────────────────────────────

type AuthContextValue = {
  session:  Session | null
  loading:  boolean
  signOut:  () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  signOut: async () => {},
})

// ─── Provider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = getBrowserClient()

    // Single source of truth for session state. INITIAL_SESSION fires on
    // mount with the current cookie-stored session (or null). SIGNED_IN /
    // SIGNED_OUT handle subsequent changes (magic-link callback, sign-out).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)

      if (event === 'INITIAL_SESSION') {
        setLoading(false)
        if (!s && !isPublicPath(pathname)) router.replace('/login')
        if (s  && pathname.startsWith('/login')) router.replace('/')
      }

      if (event === 'SIGNED_IN'  && pathname.startsWith('/login')) router.replace('/')
      if (event === 'SIGNED_OUT' && !isPublicPath(pathname))       router.replace('/login')
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount — pathname captured via closure for initial check only

  async function signOut() {
    await getBrowserClient().auth.signOut()
    router.push('/login')
  }

  // Avoid flashing protected content while the session check runs
  if (loading && !isPublicPath(pathname)) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: '#0F1B4A' }}
      />
    )
  }

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext)
}
