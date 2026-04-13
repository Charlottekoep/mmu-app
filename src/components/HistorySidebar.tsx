'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase'
import type { MmuSession } from '@/lib/types'

type Props = {
  open:             boolean
  onClose:          () => void
  currentSessionId?: string
}

function formatSessionTitle(isoDate: string) {
  // "MMU 20 April 2026"
  return 'MMU ' + new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  })
}

export default function HistorySidebar({
  open,
  onClose,
  currentSessionId,
}: Props) {
  const [sessions, setSessions] = useState<MmuSession[]>([])
  const [loading, setLoading]   = useState(false)

  // Fetch lazily — only on first open
  useEffect(() => {
    if (!open || sessions.length > 0) return
    setLoading(true)
    getBrowserClient()
      .from('mmu_sessions')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data }) => {
        setSessions(data ?? [])
        setLoading(false)
      })
  }, [open, sessions.length])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-white/10 bg-secondary shadow-elevated transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Session history"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <span className="type-eyebrow text-white">Session History</span>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-md p-1 text-white/40 transition-colors hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M4 4L14 14M14 4L4 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Session list */}
        <nav className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <p className="px-6 py-4 type-eyebrow text-white/65">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="px-6 py-4 type-eyebrow text-white/65">No sessions yet</p>
          ) : (
            sessions.map((s) => {
              const isCurrent = s.id === currentSessionId
              return (
                <Link
                  key={s.id}
                  href={`/presentation/${s.id}`}
                  onClick={onClose}
                  className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/5 ${
                    isCurrent ? 'bg-white/10' : ''
                  }`}
                >
                  <div>
                    <p className="text-[17px] leading-snug text-white">
                      {formatSessionTitle(s.date)}
                    </p>
                  </div>
                  {isCurrent && (
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                </Link>
              )
            })
          )}
        </nav>
      </aside>
    </>
  )
}
