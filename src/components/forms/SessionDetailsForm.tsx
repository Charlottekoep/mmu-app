'use client'

import { useState, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { MmuSession, SessionSection, TeamMember } from '@/lib/types'
import TeamAvatar from '@/components/TeamAvatar'

// ─── Shared styles ────────────────────────────────────────────────────────

const fieldLabel = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls   = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] outline-none transition-colors focus:border-[#2969FF]'
const selectCls  = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] outline-none transition-colors focus:border-[#2969FF] appearance-none'

// ─── Props ────────────────────────────────────────────────────────────────

type Props = {
  session:        MmuSession
  teamMembers:    TeamMember[]
  welcomeSection: SessionSection | undefined
  onDateChange:   (date: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────

export default function SessionDetailsForm({ session, teamMembers, welcomeSection, onDateChange }: Props) {
  const raw = (welcomeSection?.content ?? {}) as { host_id?: string }

  const [date,       setDate]       = useState(session.date)
  const [message,    setMessage]    = useState(session.welcome_message ?? '')
  const [hostId,     setHostId]     = useState(raw.host_id ?? '')
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── mmu_sessions saves ──────────────────────────────────────────────────

  async function saveSessionField(patch: { date?: string; welcome_message?: string | null }) {
    setSaving(true); setSaved(false); setErrorMsg(null)
    const { error: err } = await getBrowserClient()
      .from('mmu_sessions')
      .update(patch)
      .eq('id', session.id)
    if (err) {
      console.error('[SessionDetailsForm] mmu_sessions update failed:', err)
      setSaving(false)
      setErrorMsg(err.message)
      setTimeout(() => setErrorMsg(null), 5000)
      return
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── welcome section content save ────────────────────────────────────────
  // Stores host_id (and any other welcome-specific data) in
  // session_sections.content for section_type = 'welcome'.
  //
  // Requires the DB to have 'welcome' in the section_type CHECK constraint:
  //   ALTER TABLE session_sections DROP CONSTRAINT session_sections_section_type_check;
  //   ALTER TABLE session_sections ADD CONSTRAINT session_sections_section_type_check
  //     CHECK (section_type IN (
  //       'welcome','just_humans','north_star','deep_dive',
  //       'show_and_tell','announcements','the_league'
  //     ));
  //   CREATE UNIQUE INDEX IF NOT EXISTS session_sections_session_type_idx
  //     ON session_sections (session_id, section_type);

  async function saveWelcomeContent(patch: Record<string, unknown>) {
    setSaving(true); setSaved(false); setErrorMsg(null)

    const supabase = getBrowserClient()

    // Merge patch over whatever is already in the welcome section content
    const existingContent = welcomeSection?.content ?? {}
    const content = { ...existingContent, ...patch }

    if (welcomeSection?.id) {
      // Row exists — just update the content blob
      const { error: err } = await supabase
        .from('session_sections')
        .update({ content })
        .eq('id', welcomeSection.id)

      if (err) {
        console.error('[SessionDetailsForm] welcome section UPDATE failed:', err)
        setSaving(false)
        setErrorMsg(err.message)
        setTimeout(() => setErrorMsg(null), 5000)
        return
      }
    } else {
      // No welcome row yet — upsert so a concurrent save doesn't double-insert.
      // This requires the unique index on (session_id, section_type) above.
      const { error: err } = await supabase
        .from('session_sections')
        .upsert(
          {
            session_id:    session.id,
            section_type:  'welcome' as const,
            display_order: 0,
            is_active:     true,
            content,
          },
          { onConflict: 'session_id,section_type' },
        )

      if (err) {
        console.error('[SessionDetailsForm] welcome section UPSERT failed:', err)
        setSaving(false)
        setErrorMsg(err.message)
        setTimeout(() => setErrorMsg(null), 5000)
        return
      }
    }

    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setDate(val)
    onDateChange(val)
    saveSessionField({ date: val })
  }

  function handleMessageChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setMessage(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveSessionField({ welcome_message: val }), 800)
  }

  function handleHostChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setHostId(val)
    saveWelcomeContent({ host_id: val || null })
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 space-y-8">
      <SaveIndicator saving={saving} saved={saved} errorMsg={errorMsg} />

      {/* Session date */}
      <div>
        <label className={fieldLabel}>Session date</label>
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className={`${inputCls} w-52`}
        />
        <p className="mt-1.5 text-[12px] text-[#969696]">
          The date this MMU is scheduled to run. This is shown as the session title everywhere.
        </p>
      </div>

      {/* Welcome message */}
      <div>
        <label className={fieldLabel}>Welcome message</label>
        <textarea
          value={message}
          onChange={handleMessageChange}
          rows={3}
          placeholder="A brief message to open the session…"
          className={`${inputCls} resize-none`}
        />
        <p className="mt-1.5 text-[12px] text-[#969696]">
          Displayed on the welcome slide during the presentation.
        </p>
      </div>

      {/* Host */}
      <div>
        <label className={fieldLabel}>Your host</label>
        <div className="flex items-center gap-3">
          <TeamAvatar member={teamMembers.find((m) => m.id === hostId)} size={36} className="border border-[#DEDEDE]" />
          <select
            value={hostId}
            onChange={handleHostChange}
            className={selectCls}
          >
            <option value="">— select —</option>
            {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <p className="mt-1.5 text-[12px] text-[#969696]">
          Shown in the top-right corner of the welcome slide.
        </p>
      </div>
    </div>
  )
}

// ─── Save indicator ───────────────────────────────────────────────────────

function SaveIndicator({
  saving,
  saved,
  errorMsg,
}: {
  saving:   boolean
  saved:    boolean
  errorMsg: string | null
}) {
  if (!saving && !saved && !errorMsg) return null
  return (
    <div
      className={`fixed bottom-6 right-8 z-10 max-w-sm rounded-xl px-4 py-2 text-[12px] shadow-md ${
        errorMsg ? 'bg-red-600 text-white' : 'bg-[#262626] text-white'
      }`}
    >
      {saving ? 'Saving…' : errorMsg ? `Save failed: ${errorMsg}` : 'Saved ✓'}
    </div>
  )
}
