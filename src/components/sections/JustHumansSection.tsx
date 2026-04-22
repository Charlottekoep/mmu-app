'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember, ImageItem } from '@/lib/types'
import { normaliseImages } from '@/lib/types'
import DarkPageLayout  from '@/components/DarkPageLayout'
import TeamAvatar      from '@/components/TeamAvatar'
import PresenterBadge  from '@/components/PresenterBadge'
import AlignedImages   from '@/components/AlignedImages'

// ─── Content type ─────────────────────────────────────────────────────────

type Content = {
  presenter_id:   string
  presenter_id_2: string
  subject_id:     string
  spotlight:      string
  images:         (string | ImageItem)[]
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

  const content    = (section.content ?? {}) as Partial<Content>
  const presenter  = members.find((m) => m.id === content.presenter_id)
  const presenter2 = members.find((m) => m.id === content.presenter_id_2)
  const subject    = members.find((m) => m.id === content.subject_id)
  const images     = content.images ?? []

  return (
    <DarkPageLayout>
      <div className="flex h-screen overflow-hidden">

        {/* ── Left column — subject only ──────────────────────────────── */}
        <div className="relative flex w-[35%] flex-shrink-0 flex-col items-center justify-center border-r border-white/10 px-10 pt-24 pb-16">

          {/* Subject card */}
          <PersonCard member={subject} label="In the spotlight" variant="spotlight" />

        </div>

        {/* ── Right column — spotlight content ───────────────────────── */}
        <div className="relative flex flex-1 flex-col justify-center overflow-y-auto px-14 pt-24 pb-16">

          {/* Presenter badge — top right of content area, below nav bar */}
          {presenter && (
            <div className="absolute top-24 right-12 z-10">
              <PresenterBadge presenter={presenter} presenter2={presenter2} />
            </div>
          )}

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
            <AlignedImages
              images={normaliseImages(images)}
              className="mt-10"
            />
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
