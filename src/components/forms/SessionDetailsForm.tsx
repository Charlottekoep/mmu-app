'use client'

import { useState, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { MmuSession } from '@/lib/types'

// ─── Shared styles ────────────────────────────────────────────────────────

const fieldLabel = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls   = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] outline-none transition-colors focus:border-[#2969FF]'

// ─── Props ────────────────────────────────────────────────────────────────

type Props = {
  session:      MmuSession
  onDateChange: (date: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────

export default function SessionDetailsForm({ session, onDateChange }: Props) {
  const [date,    setDate]    = useState(session.date)
  const [message, setMessage] = useState(session.welcome_message ?? '')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function saveField(patch: { date?: string; welcome_message?: string }) {
    setSaving(true); setSaved(false); setError(false)
    const { error: err } = await getBrowserClient()
      .from('mmu_sessions')
      .update(patch)
      .eq('id', session.id)
    if (err) {
      setSaving(false); setError(true)
      setTimeout(() => setError(false), 3000)
      return
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setDate(val)
    onDateChange(val)
    saveField({ date: val })
  }

  function handleMessageChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setMessage(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveField({ welcome_message: val }), 800)
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 space-y-8">
      <SaveIndicator saving={saving} saved={saved} error={error} />

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
    </div>
  )
}

// ─── Save indicator ───────────────────────────────────────────────────────

function SaveIndicator({ saving, saved, error }: { saving: boolean; saved: boolean; error: boolean }) {
  if (!saving && !saved && !error) return null
  return (
    <div className={`fixed bottom-6 right-8 z-10 rounded-full px-4 py-2 text-[12px] shadow-md ${error ? 'bg-red text-white' : 'bg-[#262626] text-white'}`}>
      {saving ? 'Saving…' : error ? 'Save failed' : 'Saved ✓'}
    </div>
  )
}
