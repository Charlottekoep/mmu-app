'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember } from '@/lib/types'
import type { Block } from '@/components/blocks/BlockTypes'
import DarkPageLayout    from '@/components/DarkPageLayout'
import PresenterBadge   from '@/components/PresenterBadge'
import DeepDiveBlockView from '@/components/blocks/DeepDiveBlockView'

// ─── Content type ─────────────────────────────────────────────────────────

type StoredContent = {
  presenter_id:   string
  presenter_id_2: string
  topic:          string
  duration_min:   number
  demo_url:       string
  blocks:         Block[]
}

// ─── Component ────────────────────────────────────────────────────────────

type Props = { section: SessionSection; sessionId: string }

export default function ShowAndTellSection({ section }: Props) {
  if (!section.is_active) return null

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

  const content    = (section.content ?? {}) as Partial<StoredContent>
  const presenter  = members.find((m) => m.id === content.presenter_id)
  const presenter2 = members.find((m) => m.id === content.presenter_id_2)
  const blocks     = content.blocks ?? []

  return (
    <DarkPageLayout>
      <div className="h-screen overflow-y-auto px-14 pt-24 pb-20">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-3 flex items-start justify-between">
          <p className="type-eyebrow text-white">Show &amp; Tell</p>
          {presenter && <PresenterBadge presenter={presenter} presenter2={presenter2} />}
        </div>

        {/* ── Title + meta ───────────────────────────────────────────── */}
        <h2 className="type-h2 text-white mt-4 mb-3">
          {content.topic ?? 'Show & Tell'}
        </h2>

        {content.duration_min && (
          <p className="mb-10 text-[14px] text-white/65">
            {content.duration_min} min
          </p>
        )}

        {/* ── Demo launch button ─────────────────────────────────────── */}
        {content.demo_url && (
          <div className="mb-10">
            <a
              href={content.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-[15px] font-bold text-white shadow-elevated transition-all hover:bg-primary/80 hover:shadow-none"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 2a7 7 0 100 14A7 7 0 009 2z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 6.5l5 2.5-5 2.5V6.5z" fill="currentColor"/>
              </svg>
              Launch demo
            </a>
          </div>
        )}

        {/* ── Blocks ─────────────────────────────────────────────────── */}
        {blocks.length > 0 ? (
          <DeepDiveBlockView content={{ title: '', blocks, enabled: true }} />
        ) : (
          <p className="text-[15px] italic text-white/30">No content added yet.</p>
        )}

      </div>
    </DarkPageLayout>
  )
}
