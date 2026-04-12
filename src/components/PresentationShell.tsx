'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import DarkPageLayout    from '@/components/DarkPageLayout'
import HistorySidebar    from '@/components/HistorySidebar'
import WelcomeSection    from '@/components/sections/WelcomeSection'
import NorthStarSection  from '@/components/sections/NorthStarSection'
import JustHumansSection from '@/components/sections/JustHumansSection'
import DeepDiveSection   from '@/components/sections/DeepDiveSection'
import ShowAndTellSection  from '@/components/sections/ShowAndTellSection'
import AnnouncementsSection from '@/components/sections/AnnouncementsSection'
import TheLeagueSection  from '@/components/sections/TheLeagueSection'
import type { MmuSession, SessionSection } from '@/lib/types'

// ─── Slide type ───────────────────────────────────────────────────────────
// Slide 0 is always the synthetic WelcomeSection; the rest are DB sections.

type Slide =
  | { kind: 'welcome' }
  | { kind: 'section'; section: SessionSection }

// ─── Section labels (for progress dots) ──────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  just_humans:   'Just Humans',
  north_star:    'North Star',
  deep_dive:     'Deep Dive',
  show_and_tell: 'Show & Tell',
  announcements: 'Announcements',
  the_league:    'The League',
}

// ─── Section renderer ─────────────────────────────────────────────────────

function SectionRenderer({
  section,
  sessionId,
}: {
  section:   SessionSection
  sessionId: string
}) {
  switch (section.section_type) {
    case 'just_humans':
      return <JustHumansSection section={section} sessionId={sessionId} />
    case 'north_star':
      return <NorthStarSection sessionId={sessionId} />
    case 'deep_dive':
      return <DeepDiveSection section={section} sessionId={sessionId} />
    case 'show_and_tell':
      return <ShowAndTellSection section={section} sessionId={sessionId} />
    case 'announcements':
      return <AnnouncementsSection section={section} sessionId={sessionId} />
    case 'the_league':
      return <TheLeagueSection section={section} sessionId={sessionId} />
    default:
      return (
        <DarkPageLayout>
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <p className="type-eyebrow text-white/30 mb-4">Coming soon</p>
              <h2 className="type-h2 text-white">
                {SECTION_LABELS[section.section_type] ?? section.section_type}
              </h2>
            </div>
          </div>
        </DarkPageLayout>
      )
  }
}

// ─── Shell ────────────────────────────────────────────────────────────────

type Props = {
  session:  MmuSession
  sections: SessionSection[]
}

export default function PresentationShell({ session, sections }: Props) {
  const [index,       setIndex]       = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Build the full slides array: welcome + DB sections
  const slides = useMemo<Slide[]>(
    () => [
      { kind: 'welcome' },
      ...sections.map((s) => ({ kind: 'section' as const, section: s })),
    ],
    [sections],
  )

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const next = useCallback(
    () => setIndex((i) => Math.min(slides.length - 1, i + 1)),
    [slides.length],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'Escape')     setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  const hasPrev = index > 0
  const hasNext = index < slides.length - 1

  // Label for a slide (used in progress dots aria-label)
  function slideLabel(slide: Slide) {
    if (slide.kind === 'welcome') return 'Welcome'
    return SECTION_LABELS[slide.section.section_type] ?? slide.section.section_type
  }

  return (
    <>
      {/* ── History sidebar ─────────────────────────────────────────── */}
      <HistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentSessionId={session.id}
      />

      {/* ── All slides (pre-rendered; only the active one is visible) ── */}
      {slides.length === 0 ? (
        <DarkPageLayout>
          <div className="flex h-screen items-center justify-center">
            <p className="type-eyebrow text-white/30">No active sections</p>
          </div>
        </DarkPageLayout>
      ) : (
        slides.map((slide, i) => (
          <div
            key={slide.kind === 'welcome' ? '__welcome__' : slide.section.id}
            className={i !== index ? 'hidden' : undefined}
          >
            {slide.kind === 'welcome' ? (
              <WelcomeSection session={session} sections={sections} />
            ) : (
              <SectionRenderer section={slide.section} sessionId={session.id} />
            )}
          </div>
        ))
      )}

      {/* ── Top bar (fixed overlay) ────────────────────────────────── */}
      <div
        className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-8 py-6 pointer-events-none"
        aria-hidden="true"
      >
        {/* History — top left */}
        <button
          aria-hidden="false"
          onClick={() => setSidebarOpen(true)}
          className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/20 bg-secondary/60 px-4 py-2.5 type-eyebrow text-white/60 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
        >
          <svg width="15" height="11" viewBox="0 0 15 11" fill="none" aria-hidden="true">
            <rect width="15" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="0" y="4.75" width="11" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="0" y="9.5"  width="7"  height="1.5" rx="0.75" fill="currentColor" />
          </svg>
          History
        </button>

        {/* Session label — centre */}
        <span className="type-eyebrow text-white/30">
          MMU&nbsp;#{session.session_number}
        </span>

        {/* Edit — top right */}
        <Link
          aria-hidden="false"
          href={`/edit/${session.id}`}
          className="pointer-events-auto rounded-full border border-white/20 bg-secondary/60 px-4 py-2.5 type-eyebrow text-white/60 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
        >
          Edit
        </Link>
      </div>

      {/* ── Left arrow ───────────────────────────────────────────────── */}
      <button
        onClick={prev}
        disabled={!hasPrev}
        aria-label="Previous section"
        className={`fixed left-6 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-secondary/60 text-white/60 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white ${
          !hasPrev ? 'pointer-events-none opacity-0' : ''
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Right arrow ──────────────────────────────────────────────── */}
      <button
        onClick={next}
        disabled={!hasNext}
        aria-label="Next section"
        className={`fixed right-6 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-secondary/60 text-white/60 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white ${
          !hasNext ? 'pointer-events-none opacity-0' : ''
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M7 4L12 9L7 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Progress dots ────────────────────────────────────────────── */}
      {slides.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-8 z-20 flex items-center justify-center gap-2.5"
          role="tablist"
          aria-label="Sections"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.kind === 'welcome' ? '__welcome__' : slide.section.id}
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to ${slideLabel(slide)}`}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all duration-200 ${
                i === index
                  ? 'h-2.5 w-2.5 bg-primary shadow-pill'
                  : 'h-2 w-2 bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </>
  )
}
