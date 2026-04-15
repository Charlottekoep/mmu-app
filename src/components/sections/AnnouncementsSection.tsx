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
  presenter_id:   string
  presenter_id_2: string
  items:          AnnouncementItem[]
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

  const content    = (section.content ?? {}) as Partial<Content>
  const presenter  = members.find((m) => m.id === content.presenter_id)
  const presenter2 = members.find((m) => m.id === content.presenter_id_2)
  const items      = (content.items ?? []).filter((it) => it.text)

  return (
    <DarkPageLayout>
      <div className="h-screen overflow-y-auto px-14 pt-24 pb-20">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="type-eyebrow text-white mb-3">Team Announcements</p>
            <h2 className="type-h2 text-white">What&apos;s new</h2>
          </div>
          {presenter && <PresenterBadge presenter={presenter} presenter2={presenter2} />}
        </div>

        {/* ── Announcement cards ─────────────────────────────────────── */}
        {items.length === 0 ? (
          <p className="type-eyebrow text-white/65">No announcements yet</p>
        ) : (() => {
          const withImage    = items.filter((it) => it.image_url)
          const withoutImage = items.filter((it) => !it.image_url)
          return (
            <>
              {/* Text-only announcements — bulleted list */}
              {withoutImage.length > 0 && (
                <ul className={`space-y-5 ${withImage.length > 0 ? 'mb-10' : ''}`}>
                  {withoutImage.map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span className="mt-[9px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/50" />
                      <span className="text-[18px] font-medium leading-relaxed text-white/85">
                        {item.text}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center gap-1 text-[13px] text-primary/70 hover:text-primary"
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                              <path d="M1 9L9 1M9 1H3.5M9 1v5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Open link
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Cards for announcements with images */}
              {withImage.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {withImage.map((item, i) => (
                    <AnnouncementCard key={i} item={item} />
                  ))}
                </div>
              )}
            </>
          )
        })()}

      </div>
    </DarkPageLayout>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function AnnouncementCard({ item }: { item: AnnouncementItem }) {
  const inner = (
    <div
      className="group flex flex-col overflow-hidden rounded-xl transition-all hover:bg-white/[0.08]"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
    >
      {/* Text at top — 16px padding */}
      <div className="p-4">
        <p className="text-[15px] font-medium leading-snug text-white">
          {item.text}
        </p>
        {item.url && (
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-primary/70 group-hover:text-primary">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1 9L9 1M9 1H3.5M9 1v5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Open link
          </p>
        )}
      </div>
      {/* Image below — fills card width, natural height */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt=""
        className="w-full h-auto object-cover"
      />
    </div>
  )

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    )
  }
  return inner
}
