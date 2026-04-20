'use client'

import { useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'

const ALLOWED_DOMAINS = ['root.co.za', 'rootplatform.com']

function isAllowedEmail(email: string) {
  const domain = email.split('@')[1]?.toLowerCase().trim()
  return ALLOWED_DOMAINS.includes(domain ?? '')
}

export default function LoginPage() {
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [error,  setError]  = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!isAllowedEmail(email)) {
      setStatus('error')
      setError('Access is restricted to Root team members only.')
      return
    }

    setStatus('loading')

    const { error: sbError } = await getBrowserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (sbError) {
      setStatus('error')
      setError(sbError.message)
      return
    }

    setStatus('sent')
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: '#0F1B4A' }}
    >
      {/* Blue glow — top right */}
      <div
        className="pointer-events-none absolute -right-48 -top-48 h-[640px] w-[640px]"
        style={{ background: 'radial-gradient(circle, rgba(41,105,255,0.22) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-[360px]">
        {/* Root logo */}
        <div className="mb-12 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/RootLogo-RGB-FullColWhtxt.svg" alt="Root" className="h-8 w-auto" />
        </div>

        {status === 'sent' ? (
          /* ── Success ── */
          <div className="text-center">
            <div className="mb-5 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2969FF]/20">
                <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="20" height="16" rx="3" stroke="#2969FF" strokeWidth="1.6"/>
                  <path d="M1 5l10 7 10-7" stroke="#2969FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h2 className="text-[22px] font-bold text-white">Check your inbox</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-white/55">
              We&apos;ve sent a login link to
              <br />
              <span className="font-semibold text-white/80">{email}</span>
            </p>
            <button
              type="button"
              onClick={() => { setStatus('idle'); setEmail('') }}
              className="mt-7 text-[13px] text-white/35 transition-colors hover:text-white/60"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <>
            <div className="mb-8 text-center">
              <p className="type-eyebrow text-[#2969FF] mb-3">Monday Mission Update</p>
              <h1 className="text-[26px] font-bold leading-tight text-white">Sign in to continue</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
                placeholder="you@root.co.za"
                required
                autoFocus
                className="w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3.5 text-[15px] text-white placeholder-white/30 outline-none transition-colors focus:border-[#2969FF] focus:bg-white/[0.09]"
              />

              {status === 'error' && error && (
                <p className="text-[13px] text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-xl py-3.5 text-[15px] font-bold text-white transition-opacity disabled:opacity-60"
                style={{ background: '#2969FF' }}
              >
                {status === 'loading' ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
