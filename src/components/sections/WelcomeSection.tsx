'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { MmuSession, SessionSection, TeamMember } from '@/lib/types'
import TeamAvatar from '@/components/TeamAvatar'

// ─── Section labels for pills ─────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  just_humans:   'Just Humans',
  north_star:    'North Star',
  deep_dive:     'Deep Dive',
  show_and_tell: 'Show & Tell',
  announcements: 'Announcements',
  the_league:    'The League',
}

// ─── Component ────────────────────────────────────────────────────────────

type Props = {
  session:         MmuSession
  sections:        SessionSection[]
  welcomeSection?: SessionSection
  onNavigate?:     (sectionId: string) => void
}

export default function WelcomeSection({ session, sections, welcomeSection, onNavigate }: Props) {
  const [hostMember, setHostMember] = useState<TeamMember | null>(null)

  // Prefer the prop if it carries content; otherwise fetch the welcome section
  // from the DB directly (handles sessions created before the welcome row existed).
  const propHostId = (welcomeSection?.content as { host_id?: string } | undefined)?.host_id

  useEffect(() => {
    let cancelled = false

    async function resolveHost() {
      let hostId = propHostId

      // If prop didn't carry a host_id, fetch the welcome section from DB
      if (!hostId) {
        const { data: ws } = await getBrowserClient()
          .from('session_sections')
          .select('content')
          .eq('session_id', session.id)
          .eq('section_type', 'welcome')
          .single()

        hostId = (ws?.content as { host_id?: string } | null)?.host_id
        console.log('[WelcomeSection] fetched welcome section content:', ws?.content)
      } else {
        console.log('[WelcomeSection] welcome section content from prop:', welcomeSection?.content)
      }

      if (!hostId || cancelled) {
        if (!cancelled) setHostMember(null)
        return
      }

      const { data: member } = await getBrowserClient()
        .from('team_members')
        .select('*')
        .eq('id', hostId)
        .single()

      if (!cancelled) {
        setHostMember(member ?? null)
        if (member) {
          const photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/team-photos/${member.name}.png`
          console.log('[WelcomeSection] host member:', member.name, '| photo URL:', photoUrl)
        } else {
          console.log('[WelcomeSection] no team member found for hostId:', hostId)
        }
      }
    }

    resolveHost()
    return () => { cancelled = true }
  }, [propHostId, session.id, welcomeSection?.content])

  const activeSections = sections.filter((s) => s.is_active && s.section_type !== 'welcome')

  // "20 April 2026" — parsed without timezone shift
  const dateStr = new Date(session.date + 'T00:00:00').toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  })

  return (
    <div className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-[#0F1B4A]">

      {/* ── Radial glows ──────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[640px] w-[640px]"
        style={{ background: 'radial-gradient(circle, rgba(41,105,255,0.22) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-[560px] w-[560px]"
        style={{ background: 'radial-gradient(circle, rgba(31,200,129,0.18) 0%, transparent 70%)' }}
      />

      {/* ── Host badge — top right, below fixed nav bar ────────────────── */}
      {hostMember && (
        <div className="absolute top-24 right-12 z-10 flex flex-col items-end gap-2">
          <p className="type-eyebrow text-white/35 tracking-widest">Your host</p>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
            <div className="text-right">
              <p className="text-[15px] font-bold text-white leading-tight">{hostMember.name}</p>
              {hostMember.role && (
                <p className="mt-0.5 type-eyebrow" style={{ color: '#2969FF' }}>{hostMember.role}</p>
              )}
            </div>
            <TeamAvatar member={hostMember} size={56} className="border-2 border-white/15" />
          </div>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center px-12 text-center">

        {/* Eyebrow */}
        <p className="type-eyebrow tracking-[0.25em] text-white mb-6">
          Monday Mission Update
        </p>

        {/* Display title: MMU 20 April 2026 */}
        <h1 className="mb-6 leading-none font-black" style={{ letterSpacing: '-0.03em' }}>
          <span style={{ color: '#2969FF', fontSize: '100px' }}>MMU</span>
          <br />
          <span className="text-white" style={{ fontSize: '72px' }}>{dateStr}</span>
        </h1>

        {/* Welcome message */}
        {session.welcome_message && (
          <p
            className="my-8 max-w-2xl text-[26px] leading-relaxed"
            style={{ fontWeight: 700, color: '#2969FF' }}
          >
            {session.welcome_message}
          </p>
        )}

        {/* Divider */}
        <div className="w-full border-t border-white/10 my-6" />

        {/* ── Promises + Values ─────────────────────────────────────── */}
        <div className="w-full grid grid-cols-2 gap-4">

          {/* Promises */}
          <div
            className="rounded-xl p-5 text-left border border-white/10"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div className="mb-2 text-2xl leading-none">🤝</div>
            <p className="type-eyebrow text-primary mb-3">Promises</p>
            <ul className="space-y-2">
              <li className="text-[15px] leading-snug text-white/75">
                To provide a{' '}
                <strong className="font-bold text-white">flexible</strong>,{' '}
                <strong className="font-bold text-white">reliable</strong>,{' '}
                <strong className="font-bold text-white">elegant</strong> platform
              </li>
              <li className="text-[15px] leading-snug text-white/75">
                That our clients will work with{' '}
                <strong className="font-bold text-white">friendly</strong>,{' '}
                <strong className="font-bold text-white">resourceful</strong> professionals
              </li>
              <li className="text-[15px] leading-snug text-white/75">
                That we will go{' '}
                <strong className="font-bold text-white">above and beyond</strong> for our clients
              </li>
            </ul>
          </div>

          {/* Values */}
          <div
            className="rounded-xl p-5 text-left border border-white/10"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div className="mb-2 text-2xl leading-none">🧢</div>
            <p className="type-eyebrow text-primary mb-3">Values</p>
            <ul className="space-y-2">
              <li className="text-[15px] leading-snug text-white/75">
                We <strong className="font-bold text-white">lead by example</strong>
              </li>
              <li className="text-[15px] leading-snug text-white/75">
                We <strong className="font-bold text-white">exceed expectations</strong>
              </li>
              <li className="text-[15px] leading-snug text-white/75">
                We <strong className="font-bold text-white">rally as one team</strong>
              </li>
              <li className="text-[15px] leading-snug text-white/75">
                We <strong className="font-bold text-white">own the mission</strong>
              </li>
              <li className="text-[15px] leading-snug text-white/75">
                We <strong className="font-bold text-white">rise to the challenge</strong>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Section pills ─────────────────────────────────────────── */}
        {activeSections.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {activeSections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onNavigate?.(s.id)}
                className="cursor-pointer rounded-full border border-white/20 bg-white/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/65 transition-all hover:border-white/35 hover:bg-white/[0.18] hover:text-white/90"
              >
                {SECTION_LABELS[s.section_type] ?? s.section_type}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* ── Bottom gradient rule ───────────────────────────────────────── */}
      <div
        className="absolute bottom-0 inset-x-0 h-[2px]"
        style={{ background: 'linear-gradient(to right, #2969FF, #1FC881)' }}
      />
    </div>
  )
}
