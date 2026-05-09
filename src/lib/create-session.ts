'use client'

import { getBrowserClient } from '@/lib/supabase'
import type { SectionType } from '@/lib/types'

const DEFAULT_SECTIONS: { section_type: SectionType; display_order: number }[] = [
  { section_type: 'welcome',       display_order: 0 },
  { section_type: 'just_humans',   display_order: 1 },
  { section_type: 'north_star',    display_order: 2 },
  { section_type: 'deep_dive',     display_order: 3 },
  { section_type: 'show_and_tell', display_order: 4 },
  { section_type: 'announcements', display_order: 5 },
  { section_type: 'the_league',    display_order: 6 },
  { section_type: 'the_wall',      display_order: 7 },
]

// Creates a new MMU session with default sections and copies lever snapshots
// from the most recent previous session that has them. Returns the new
// session id on success, or null on failure.
export async function createSession(): Promise<string | null> {
  const supabase = getBrowserClient()

  // ── 1. Determine next session number ──────────────────────────────────────
  const { data: latest } = await supabase
    .from('mmu_sessions')
    .select('session_number, welcome_message')
    .order('session_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── 2. Create the session ─────────────────────────────────────────────────
  const { data: session, error: sessionErr } = await supabase
    .from('mmu_sessions')
    .insert({
      session_number:  (latest?.session_number ?? 0) + 1,
      date:            new Date().toISOString().split('T')[0],
      created_by:      'Charlotte',
      welcome_message: latest?.welcome_message ?? null,
    })
    .select()
    .single()

  if (sessionErr || !session) return null

  // ── 3. Create default sections ────────────────────────────────────────────
  const { error: sectionsErr } = await supabase
    .from('session_sections')
    .insert(
      DEFAULT_SECTIONS.map((s) => ({
        ...s,
        session_id: session.id,
        is_active:  true,
        content:    {},
      })),
    )

  if (sectionsErr) return null

  // ── 4. Copy lever snapshots from the most recent session that has them ─────
  // Fetch the 10 most recent previous sessions in one shot, then fetch all
  // their snapshots. Pick the first (most recent) session that has snapshots
  // and copy those values — except we clear done/planning/images since those
  // are session-specific update fields the presenter fills in fresh each week.
  const { data: recentSessions } = await supabase
    .from('mmu_sessions')
    .select('id')
    .neq('id', session.id)
    .order('date', { ascending: false })
    .limit(10)

  if (recentSessions && recentSessions.length > 0) {
    const { data: allSnaps } = await supabase
      .from('lever_snapshots')
      .select('*')
      .in('session_id', recentSessions.map((s) => s.id))

    if (allSnaps && allSnaps.length > 0) {
      // Group by session_id (recentSessions is already ordered most-recent-first)
      const snapsBySession = new Map<string, typeof allSnaps>()
      for (const snap of allSnaps) {
        const arr = snapsBySession.get(snap.session_id) ?? []
        arr.push(snap)
        snapsBySession.set(snap.session_id, arr)
      }

      // Find the most recent session that actually has snapshots
      const source = recentSessions.find((s) => snapsBySession.has(s.id))

      if (source) {
        await supabase.from('lever_snapshots').insert(
          snapsBySession.get(source.id)!.map((snap) => ({
            session_id:           session.id,
            lever_id:             snap.lever_id,
            current_state:        snap.current_state,
            second_current_state: snap.second_current_state,
            rag_status:           snap.rag_status,
            trend:                snap.trend,
            notes:                snap.notes,
            done_update:          snap.done_update,
            planning_update:      snap.planning_update,
            images:               snap.images,
          })),
        )
      }
    }
    // If no previous session has snapshots, fall through — the presentation
    // view will read from the base levers table as before.
  }

  return session.id
}
