'use client'

import type { MmuSession, SessionSection } from '@/lib/types'

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
  session:  MmuSession
  sections: SessionSection[]
}

export default function WelcomeSection({ session, sections }: Props) {
  const activeSections = sections.filter((s) => s.is_active)

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

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex max-w-4xl flex-col items-center px-12 text-center">
        {/* Eyebrow */}
        <p className="type-eyebrow tracking-[0.25em] text-white mb-8">
          Monday Mission Update
        </p>

        {/* Display title: MMU 20 April 2026 */}
        <h1 className="mb-8 leading-none font-black" style={{ letterSpacing: '-0.03em' }}>
          <span style={{ color: '#2969FF', fontSize: '100px' }}>MMU</span>
          <br />
          <span className="text-white" style={{ fontSize: '72px' }}>{dateStr}</span>
        </h1>

        {/* Welcome message */}
        {session.welcome_message && (
          <p
            className="mb-12 max-w-xl text-[20px] leading-relaxed text-white/65"
            style={{ fontWeight: 300 }}
          >
            {session.welcome_message}
          </p>
        )}

        {/* Active section pills */}
        {activeSections.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {activeSections.map((s) => (
              <span
                key={s.id}
                className="rounded-full border border-white/20 bg-white/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/65"
              >
                {SECTION_LABELS[s.section_type] ?? s.section_type}
              </span>
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
