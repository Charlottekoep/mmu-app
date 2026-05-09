'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase'
import { createSession } from '@/lib/create-session'
import type { MmuSession } from '@/lib/types'

const ADMIN_EMAILS = ['charlotte@root.co.za', 'jonny@rootplatform.com']

type Props = {
  open:              boolean
  onClose:           () => void
  currentSessionId?: string
}

function formatSessionTitle(isoDate: string) {
  return 'MMU ' + new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  })
}

function isPast(isoDate: string) {
  return isoDate < new Date().toISOString().split('T')[0]
}

export default function HistorySidebar({ open, onClose, currentSessionId }: Props) {
  const router = useRouter()
  const [sessions,        setSessions]        = useState<MmuSession[]>([])
  const [loading,         setLoading]         = useState(false)
  const [busy,            setBusy]            = useState(false)
  const [createErr,       setCreateErr]       = useState<string | null>(null)
  const [userEmail,       setUserEmail]       = useState<string | null>(null)
  const [showArchived,    setShowArchived]    = useState(false)
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null)
  const [archiving,       setArchiving]       = useState(false)

  const isAdmin = !!userEmail && ADMIN_EMAILS.includes(userEmail)

  async function handleCreate() {
    setBusy(true)
    setCreateErr(null)
    const sessionId = await createSession()
    if (!sessionId) {
      setCreateErr('Failed to create session.')
      setBusy(false)
      return
    }
    router.push(`/edit/${sessionId}`)
  }

  async function handleArchive(id: string) {
    setArchiving(true)
    const { error } = await getBrowserClient()
      .from('mmu_sessions')
      .update({ is_archived: true })
      .eq('id', id)
    setConfirmArchiveId(null)
    setArchiving(false)
    if (!error) {
      setSessions((prev) => prev.filter((s) => s.id !== id))
    }
  }

  // Fetch sessions and user email lazily on first open; re-fetch when showArchived changes
  useEffect(() => {
    if (!open) return

    getBrowserClient().auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null)
    })

    setLoading(true)
    let query = getBrowserClient()
      .from('mmu_sessions')
      .select('*')
      .order('date', { ascending: false })
    if (!showArchived) {
      query = query.eq('is_archived', false)
    }
    query.then(({ data }) => {
      setSessions(data ?? [])
      setLoading(false)
    })
  }, [open, showArchived])

  const visibleSessions = sessions

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
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
          ) : visibleSessions.length === 0 ? (
            <p className="px-6 py-4 type-eyebrow text-white/65">No sessions yet</p>
          ) : (
            visibleSessions.map((s) => {
              const isCurrent  = s.id === currentSessionId
              const isArchived = s.is_archived
              const showArchiveBtn = isAdmin && !isArchived

              if (confirmArchiveId === s.id) {
                return (
                  <div key={s.id} className="border-b border-white/5 px-6 py-4 bg-white/5">
                    <p className="text-[12px] leading-snug text-white/80">
                      Archive this MMU? It will be hidden from the history.
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => handleArchive(s.id)}
                        disabled={archiving}
                        className="text-[12px] font-bold disabled:opacity-50"
                        style={{ color: '#D50000' }}
                      >
                        {archiving ? 'Archiving…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmArchiveId(null)}
                        className="text-[12px] text-white/40 hover:text-white/70"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={s.id}
                  className={`group flex items-center ${isCurrent ? 'bg-white/10' : ''} ${isArchived ? 'opacity-40' : ''}`}
                >
                  <Link
                    href={`/presentation/${s.id}`}
                    onClick={onClose}
                    className="flex flex-1 items-center justify-between px-6 py-4 transition-colors hover:bg-white/5"
                  >
                    <p className="text-[17px] leading-snug text-white">
                      {formatSessionTitle(s.date)}
                    </p>
                    {isCurrent && (
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </Link>

                  {/* Archive button — admins only, past sessions only */}
                  {showArchiveBtn && (
                    <button
                      onClick={() => setConfirmArchiveId(s.id)}
                      aria-label="Archive session"
                      className="mr-4 flex-shrink-0 p-1.5 text-white/20 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white/60"
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                        <rect x="1" y="1" width="11" height="3" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M2 4v7a1 1 0 001 1h7a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M4.5 7h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              )
            })
          )}
        </nav>

        {/* Show archived toggle — admins only */}
        {isAdmin && (
          <div className="border-t border-white/10 px-6 py-4">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-2 text-[11px] text-white/35 transition-colors hover:text-white/60"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <rect x="0.6" y="0.6" width="10.8" height="3" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M1.5 3.6v6.9a0.9 0.9 0 00.9.9h7.2a0.9 0.9 0 00.9-.9V3.6" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M4 7h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
              {showArchived ? 'Hide archived' : 'Show archived'}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
