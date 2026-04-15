'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember } from '@/lib/types'
import DarkPageLayout    from '@/components/DarkPageLayout'
import PresenterBadge   from '@/components/PresenterBadge'

// ─── Content types ────────────────────────────────────────────────────────

type AnnouncementItem = {
  text:      string
  url:       string
  image_url: string
}

type Content = {
  presenter_id: string
  items:        AnnouncementItem[]
}

// ─── Component ────────────────────────────────────────────────────────────

type Props = { section: SessionSection; sessionId: string }

export default function AnnouncementsSection({ section }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    let cancelled = false
    getBrowserClient().from('team_members').select('*').then(({ data, error: err }) => {
      if (cancelled) return
      if (err) { setError(true); setLoading(false); return }
      setMembers(data ?? [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  if (loading || error) {
    return (
      <DarkPageLayout>
        <div className="flex h-screen items-center justify-center">
          {error
            ? <p className="type-eyebrow text-red">Failed to load</p>
            : <p className="type-eyebrow text-white/30">Loading…</p>}
        </div>
      </DarkPageLayout>
    )
  }

  const content   = (section.content ?? {}) as Partial<Content>
  const presenter = members.find((m) => m.id === content.presenter_id)
  const items     = (content.items ?? []).filter((it) => it.text)

  return (
    <DarkPageLayout>
      <div className="h-screen overflow-y-auto px-14 pt-24 pb-20">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="type-eyebrow text-white mb-3">Team Announcements</p>
            <h2 className="type-h2 text-white">What&apos;s new</h2>
          </div>
          {presenter && <PresenterBadge presenter={presenter} />}
        </div>

        {/* ── Announcement cards ─────────────────────────────────────── */}
        {items.length === 0 ? (
          <p className="type-eyebrow text-white/65">No announcements yet</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <AnnouncementCard key={i} item={item} />
            ))}
          </div>
        )}

      </div>
    </DarkPageLayout>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function AnnouncementCard({ item }: { item: AnnouncementItem }) {
  const inner = (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] transition-all hover:bg-white/[0.08]">
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt=""
          className="w-full h-auto object-contain"
        />
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-[15px] font-medium leading-snug text-white">
          {item.text}
        </p>
        {item.url && (
          <p className="mt-auto flex items-center gap-1.5 text-[12px] text-primary/70 group-hover:text-primary">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1 9L9 1M9 1H3.5M9 1v5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Open link
          </p>
        )}
      </div>
    </div>
  )

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    )
  }
  return inner
}
