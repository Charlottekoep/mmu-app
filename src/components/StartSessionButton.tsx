'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase'
import type { SectionType } from '@/lib/types'

const DEFAULT_SECTIONS: { section_type: SectionType; display_order: number }[] = [
  { section_type: 'just_humans',   display_order: 1 },
  { section_type: 'north_star',    display_order: 2 },
  { section_type: 'deep_dive',     display_order: 3 },
  { section_type: 'show_and_tell', display_order: 4 },
  { section_type: 'announcements', display_order: 5 },
  { section_type: 'the_league',    display_order: 6 },
]

export default function StartSessionButton() {
  const router              = useRouter()
  const [busy,  setBusy]    = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleCreate() {
    setBusy(true)
    setError(null)

    const supabase = getBrowserClient()

    // Determine next session number
    const { data: latest } = await supabase
      .from('mmu_sessions')
      .select('session_number')
      .order('session_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextNumber = (latest?.session_number ?? 0) + 1

    // Create the session
    const { data: session, error: sessionErr } = await supabase
      .from('mmu_sessions')
      .insert({
        session_number:  nextNumber,
        date:            new Date().toISOString().split('T')[0],
        created_by:      'Charlotte',
        welcome_message: null,
      })
      .select()
      .single()

    if (sessionErr || !session) {
      setError('Failed to create session — please try again.')
      setBusy(false)
      return
    }

    // Create default sections (all active by default)
    const { error: sectionsErr } = await supabase.from('session_sections').insert(
      DEFAULT_SECTIONS.map((s) => ({
        ...s,
        session_id: session.id,
        is_active:  true,
        content:    {},
      })),
    )

    if (sectionsErr) {
      setError('Session created but sections failed to initialise. Please refresh and try again.')
      setBusy(false)
      return
    }

    router.push(`/edit/${session.id}`)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleCreate}
        disabled={busy}
        className="rounded-2xl bg-primary px-10 py-5 type-h3 text-white shadow-elevated transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? 'Creating…' : 'Create new MMU'}
      </button>
      {error && (
        <p className="text-[13px] text-red/80">{error}</p>
      )}
    </div>
  )
}
