'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase'
import type { MmuSession, SectionType } from '@/lib/types'

const DEFAULT_SECTIONS: { section_type: SectionType; display_order: number }[] = [
  { section_type: 'welcome',       display_order: 0 },
  { section_type: 'just_humans',   display_order: 1 },
  { section_type: 'north_star',    display_order: 2 },
  { section_type: 'deep_dive',     display_order: 3 },
  { section_type: 'show_and_tell', display_order: 4 },
  { section_type: 'announcements', display_order: 5 },
  { section_type: 'the_league',    display_order: 6 },
]

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
  const router = useRouter()
  const [sessions, setSessions] = useState<MmuSession[]>([])
  const [loading,  setLoading]  = useState(false)
  const [busy,     setBusy]     = useState(false)
  const [createErr, setCreateErr] = useState<string | null>(null)

  async function handleCreate() {
    setBusy(true)
    setCreateErr(null)
    const supabase = getBrowserClient()

    const { data: latest } = await supabase
      .from('mmu_sessions')
      .select('session_number')
      .order('session_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: session, error: sessionErr } = await supabase
      .from('mmu_sessions')
      .insert({
        session_number:  (latest?.session_number ?? 0) + 1,
        date:            new Date().toISOString().split('T')[0],
        created_by:      'Charlotte',
        welcome_message: null,
      })
      .select()
      .single()

    if (sessionErr || !session) {
      setCreateErr('Failed to create session.')
      setBusy(false)
      return
    }

    await supabase.from('session_sections').insert(
      DEFAULT_SECTIONS.map((s) => ({
        ...s,
        session_id: session.id,
        is_active:  true,
        content:    {},
      })),
    )

    router.push(`/edit/${session.id}`)
  }

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

        {/* Create new MMU */}
        <div className="border-b border-white/10 px-4 py-4">
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy}
            className="w-full rounded-xl py-3 text-[13px] font-bold text-white transition-opacity disabled:opacity-60"
            style={{ background: '#2969FF' }}
          >
            {busy ? 'Creating…' : '+ Create new MMU'}
          </button>
          {createErr && (
            <p className="mt-2 text-[12px] text-red-400">{createErr}</p>
          )}
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
