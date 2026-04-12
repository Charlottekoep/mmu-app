'use client'

import { useState } from 'react'
import Link from 'next/link'
import type {
  MmuSession,
  SessionSection,
  TeamMember,
  Lever,
  LeverSnapshot,
  LeaderboardEntry,
} from '@/lib/types'
import JustHumansForm      from '@/components/forms/JustHumansForm'
import NorthStarUpdateForm from '@/components/forms/NorthStarUpdateForm'
import DeepDiveForm        from '@/components/forms/DeepDiveForm'
import ShowAndTellForm     from '@/components/forms/ShowAndTellForm'
import AnnouncementsForm   from '@/components/forms/AnnouncementsForm'
import TheLeagueForm       from '@/components/forms/TheLeagueForm'

// ─── Section metadata ─────────────────────────────────────────────────────

const SECTION_META: Record<string, { label: string; icon: string }> = {
  just_humans:   { label: 'Just Humans',   icon: '👥' },
  north_star:    { label: 'North Star',    icon: '⭐' },
  deep_dive:     { label: 'Deep Dive',     icon: '🔍' },
  show_and_tell: { label: 'Show & Tell',   icon: '🎯' },
  announcements: { label: 'Announcements', icon: '📢' },
  the_league:    { label: 'The League',    icon: '🏆' },
}

// ─── Props ────────────────────────────────────────────────────────────────

type Props = {
  session:     MmuSession
  sections:    SessionSection[]
  teamMembers: TeamMember[]
  levers:      Lever[]
  snapshots:   LeverSnapshot[]
  leaderboard: LeaderboardEntry[]
}

// ─── Shell ────────────────────────────────────────────────────────────────

export default function EditShell({
  session,
  sections,
  teamMembers,
  levers,
  snapshots,
  leaderboard,
}: Props) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '')

  const activeSection = sections.find((s) => s.id === activeId)

  function renderForm(section: SessionSection) {
    const common = { section, sessionId: session.id }
    switch (section.section_type) {
      case 'just_humans':
        return <JustHumansForm    {...common} teamMembers={teamMembers} />
      case 'north_star':
        return <NorthStarUpdateForm {...common} levers={levers} snapshots={snapshots} />
      case 'deep_dive':
        return <DeepDiveForm      {...common} teamMembers={teamMembers} levers={levers} />
      case 'show_and_tell':
        return <ShowAndTellForm   {...common} teamMembers={teamMembers} />
      case 'announcements':
        return <AnnouncementsForm {...common} teamMembers={teamMembers} />
      case 'the_league':
        return <TheLeagueForm     {...common} teamMembers={teamMembers} leaderboard={leaderboard} />
      default:
        return (
          <div className="flex h-64 items-center justify-center">
            <p className="type-eyebrow text-white/30">No form for this section yet</p>
          </div>
        )
    }
  }

  const sessionDate = new Date(session.date + 'T00:00:00').toLocaleDateString('en-ZA', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  })

  return (
    <div className="flex h-screen flex-col bg-[#000023] text-white overflow-hidden">

      {/* ── Global top nav ──────────────────────────────────────────────── */}
      <nav className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#050c2a] px-8 py-3.5">
        {/* Root logo */}
        <div className="flex items-center gap-3">
          <span
            className="text-[22px] font-black text-white"
            style={{ fontFamily: 'var(--font-lato)', letterSpacing: '-0.02em' }}
          >
            Root
          </span>
          <span className="hidden h-4 w-px bg-white/15 sm:block" />
          <span className="hidden text-[12px] text-white/30 sm:block">MMU Editor</span>
        </div>

        {/* Preview MMU */}
        <Link
          href={`/presentation/${session.id}`}
          className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-[13px] font-bold text-primary transition-all hover:bg-primary/20 hover:border-primary/50"
        >
          Preview MMU
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M1.5 6.5h10M6.5 1.5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </nav>

      {/* ── Sidebar + main ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <aside className="flex w-56 flex-shrink-0 flex-col border-r border-white/10 bg-[#050c2a]">
          {/* Session info */}
          <div className="border-b border-white/10 px-5 py-4">
            <p className="type-eyebrow text-white/30">MMU #{session.session_number}</p>
            <p className="mt-0.5 text-[12px] text-white/40">{sessionDate}</p>
          </div>

          {/* Sections list */}
          <nav className="flex-1 overflow-y-auto py-3" aria-label="Sections">
            {sections.map((s) => {
              const meta     = SECTION_META[s.section_type]
              const isActive = s.id === activeId
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-primary/15 text-white'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                  }`}
                >
                  <span className="text-base leading-none">{meta?.icon ?? '▸'}</span>
                  <span className="text-[13px] font-medium">{meta?.label ?? s.section_type}</span>
                  {!s.is_active && (
                    <span className="ml-auto text-[10px] text-white/20">off</span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Back to home */}
          <div className="border-t border-white/10 px-5 py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-[12px] text-white/30 hover:text-white/60 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Home
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Section header */}
          <header className="flex flex-shrink-0 items-center border-b border-white/10 bg-[#050c2a] px-8 py-3.5">
            <div>
              <h1 className="text-[15px] font-bold text-white">
                {activeSection
                  ? (SECTION_META[activeSection.section_type]?.label ?? activeSection.section_type)
                  : '—'}
              </h1>
              <p className="mt-0.5 text-[11px] text-white/25">
                Fill in content before the meeting
              </p>
            </div>
          </header>

          {/* Form area */}
          <main className="flex-1 overflow-y-auto">
            {activeSection ? (
              renderForm(activeSection)
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="type-eyebrow text-white/20">Select a section to edit</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
