'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember } from '@/lib/types'
import DarkPageLayout from '@/components/DarkPageLayout'

// ─── Content type ─────────────────────────────────────────────────────────

type Content = {
  presenter_id: string
  subject_id:   string
  spotlight:    string
}

// ─── Component ────────────────────────────────────────────────────────────

type Props = { section: SessionSection; sessionId: string }

export default function JustHumansSection({ section }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    let cancelled = false
    getBrowserClient()
      .from('team_members')
      .select('*')
      .then(({ data, error: err }) => {
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
            ? <p className="type-eyebrow text-red">Failed to load members</p>
            : <p className="type-eyebrow text-white/30">Loading…</p>}
        </div>
      </DarkPageLayout>
    )
  }

  const content  = (section.content ?? {}) as Partial<Content>
  const presenter = members.find((m) => m.id === content.presenter_id)
  const subject   = members.find((m) => m.id === content.subject_id)

  return (
    <DarkPageLayout>
      <div className="h-screen overflow-y-auto px-14 pt-24 pb-20">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-12">
          <p className="type-eyebrow text-white mb-2">Just Humans</p>
          <h2 className="type-h2 text-white">
            {subject ? subject.name : 'Team Spotlight'}
          </h2>
        </div>

        {/* ── Profile cards ──────────────────────────────────────────── */}
        <div className="flex items-center gap-8 mb-14">
          {/* Presenter card */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-8 min-w-[220px]">
            <MemberAvatar member={presenter} size={120} />
            <div className="text-center">
              <p className="text-[16px] font-bold text-white">
                {presenter?.name ?? '—'}
              </p>
              <p className="mt-1 text-[13px] text-white/65">{presenter?.role ?? ''}</p>
            </div>
            <span className="type-eyebrow text-white/65">Presenter</span>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-2 text-white/20">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                d="M6 16h20M18 8l8 8-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="type-eyebrow text-white/20">presents</span>
          </div>

          {/* Subject card */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary/25 bg-primary/[0.07] p-8 min-w-[220px]">
            <MemberAvatar member={subject} size={120} />
            <div className="text-center">
              <p className="text-[16px] font-bold text-white">
                {subject?.name ?? '—'}
              </p>
              <p className="mt-1 text-[13px] text-white/65">{subject?.role ?? ''}</p>
            </div>
            <span className="type-eyebrow text-primary/60">In the spotlight</span>
          </div>
        </div>

        {/* ── Spotlight content ──────────────────────────────────────── */}
        {content.spotlight && (
          <div className="max-w-2xl">
            <p className="type-eyebrow text-white mb-4">Spotlight</p>
            <div
              className="text-[16px] leading-relaxed text-white/65 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1.5 [&_strong]:text-white [&_em]:italic"
              dangerouslySetInnerHTML={{ __html: content.spotlight }}
            />
          </div>
        )}

      </div>
    </DarkPageLayout>
  )
}

// ─── Avatar helper ────────────────────────────────────────────────────────

function MemberAvatar({ member, size }: { member: TeamMember | undefined; size: number }) {
  const s = `${size}px`

  if (!member) {
    return (
      <div
        className="rounded-full bg-white/10 border border-white/10 flex-shrink-0"
        style={{ width: s, height: s }}
      />
    )
  }

  if (member.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.photo_url}
        alt={member.name}
        className="rounded-full object-cover border-2 border-white/15 flex-shrink-0"
        style={{ width: s, height: s }}
      />
    )
  }

  return (
    <div
      className="rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center flex-shrink-0 text-primary font-black"
      style={{ width: s, height: s, fontSize: `${size * 0.38}px` }}
    >
      {member.name[0]}
    </div>
  )
}
