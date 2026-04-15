'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember } from '@/lib/types'
import DarkPageLayout from '@/components/DarkPageLayout'
import TeamAvatar    from '@/components/TeamAvatar'

// ─── Content type ─────────────────────────────────────────────────────────

type Content = {
  presenter_id: string
  subject_id:   string
  spotlight:    string
  images:       string[]
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

  const content   = (section.content ?? {}) as Partial<Content>
  const presenter = members.find((m) => m.id === content.presenter_id)
  const subject   = members.find((m) => m.id === content.subject_id)
  const images    = content.images ?? []

  return (
    <DarkPageLayout>
      <div className="flex h-screen overflow-hidden">

        {/* ── Left column — presenter → subject ──────────────────────── */}
        <div className="relative flex w-[35%] flex-shrink-0 flex-col items-center justify-center border-r border-white/10 px-10 py-16">

          {/* Presenter card */}
          <PersonCard member={presenter} label="Presenter" variant="default" />

          {/* Connector */}
          <div className="flex flex-col items-center gap-1.5 py-5">
            <span className="type-eyebrow text-white/25">presents</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M9 3v12M4 10l5 5 5-5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Subject card */}
          <PersonCard member={subject} label="In the spotlight" variant="spotlight" />

        </div>

        {/* ── Right column — spotlight content ───────────────────────── */}
        <div className="flex flex-1 flex-col justify-center overflow-y-auto px-14 py-16">

          <p className="type-eyebrow text-white mb-3">Spotlight</p>

          <h2 className="type-h2 text-white mb-8">
            {subject?.name ?? 'Team Spotlight'}
          </h2>

          {content.spotlight && (
            <div
              className="max-w-2xl text-[18px] leading-relaxed text-white/70 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1.5 [&_strong]:font-bold [&_strong]:text-white [&_em]:italic"
              dangerouslySetInnerHTML={{ __html: content.spotlight }}
            />
          )}

          {images.length > 0 && (
            <div
              className={`mt-10 grid gap-3 ${
                images.length === 1 ? 'grid-cols-1 max-w-2xl'
                : images.length === 2 ? 'grid-cols-2'
                : 'grid-cols-3'
              }`}
            >
              {images.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-full h-auto rounded-xl border border-white/10"
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </DarkPageLayout>
  )
}

// ─── Person card ──────────────────────────────────────────────────────────

type CardVariant = 'default' | 'spotlight'

function PersonCard({
  member,
  label,
  variant,
}: {
  member:  TeamMember | undefined
  label:   string
  variant: CardVariant
}) {
  const isSpotlight = variant === 'spotlight'
  return (
    <div
      className="flex w-full max-w-[260px] flex-col items-center gap-5 rounded-2xl p-8"
      style={{
        border:     isSpotlight ? '1px solid rgba(41,105,255,0.30)' : '1px solid rgba(255,255,255,0.10)',
        background: isSpotlight ? 'rgba(41,105,255,0.07)'           : 'rgba(255,255,255,0.04)',
      }}
    >
      <TeamAvatar
        member={member}
        size={100}
        className={isSpotlight ? 'border-2 border-primary/35' : 'border-2 border-white/15'}
      />
      <div className="text-center">
        <p className="text-[17px] font-bold text-white leading-snug">
          {member?.name ?? '—'}
        </p>
        {member?.role && (
          <p className="mt-1 type-eyebrow" style={{ color: '#2969FF' }}>{member.role}</p>
        )}
      </div>
      <span
        className="type-eyebrow"
        style={{ color: isSpotlight ? 'rgba(41,105,255,0.75)' : 'rgba(255,255,255,0.35)' }}
      >
        {label}
      </span>
    </div>
  )
}
