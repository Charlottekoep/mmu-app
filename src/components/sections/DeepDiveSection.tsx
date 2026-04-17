'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember } from '@/lib/types'
import type { Block } from '@/components/blocks/BlockTypes'
import DarkPageLayout    from '@/components/DarkPageLayout'
import PresenterBadge   from '@/components/PresenterBadge'
import DeepDiveBlockView from '@/components/blocks/DeepDiveBlockView'

// ─── Content shape as stored by DeepDiveForm ──────────────────────────────

type StoredContent = {
  title:          string
  presenter_id:   string
  presenter_id_2: string
  lever_id:       string
  blocks:         Block[]
}

// ─── Props ────────────────────────────────────────────────────────────────

type Props = { section: SessionSection; sessionId: string }

// ─── Component ────────────────────────────────────────────────────────────

export default function DeepDiveSection({ section }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    // Skip fetch entirely when this section is toggled off
    if (!section.is_active) {
      setLoading(false)
      return
    }

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
  }, [section.is_active])

  // Section disabled — render nothing
  if (!section.is_active) return null

  if (loading) {
    return (
      <DarkPageLayout>
        <div className="flex h-screen items-center justify-center">
          <p className="type-eyebrow text-white/30">Loading…</p>
        </div>
      </DarkPageLayout>
    )
  }

  if (error) {
    return (
      <DarkPageLayout>
        <div className="flex h-screen items-center justify-center">
          <p className="type-eyebrow text-red">Failed to load</p>
        </div>
      </DarkPageLayout>
    )
  }

  const stored     = (section.content ?? {}) as Partial<StoredContent>
  const presenter  = members.find((m) => m.id === stored.presenter_id)
  const presenter2 = members.find((m) => m.id === stored.presenter_id_2)
  const blocks     = stored.blocks ?? []

  return (
    <DarkPageLayout>
      <div className="h-screen overflow-y-auto px-14 pt-24 pb-20">

        {/* ── Header row ───────────────────────────────────────────── */}
        <div className="mb-10 flex items-start justify-between gap-6">
          <div>
            <p className="type-eyebrow text-white mb-3">Deep Dive</p>
            <h2 className="type-h2 text-white">
              {stored.title ?? 'Deep Dive'}
            </h2>
          </div>
          {presenter && (
            <PresenterBadge presenter={presenter} presenter2={presenter2} />
          )}
        </div>

        {/* ── Content blocks ───────────────────────────────────────── */}
        {blocks.length > 0 ? (
          <DeepDiveBlockView
            content={{
              title:   '',
              blocks,
              enabled: true,
            }}
          />
        ) : (
          <p className="text-[15px] text-white/30 italic">No content added yet.</p>
        )}

      </div>
    </DarkPageLayout>
  )
}
