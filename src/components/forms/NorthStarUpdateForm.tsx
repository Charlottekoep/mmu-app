'use client'

import { useState, useCallback, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, Lever, LeverSnapshot, RagStatus } from '@/lib/types'

// ─── Focus area groups ────────────────────────────────────────────────────

const GROUPS: { key: string; label: string }[] = [
  { key: 'north_star',            label: 'North Star' },
  { key: 'grow_client_base',      label: 'Grow Our Client Base' },
  { key: 'increase_client_value', label: 'Increase Client Value' },
  { key: 'returns_to_scale',      label: 'Returns to Scale' },
  { key: 'enablers',              label: 'Enablers' },
]

// ─── Types ────────────────────────────────────────────────────────────────

type LeverState = {
  lever_id:      string
  current_state: string
  rag_status:    RagStatus
  trend:         'up' | 'flat' | 'down' | null
  notes:         string
}

type Props = {
  section:   SessionSection
  sessionId: string
  levers:    Lever[]
  snapshots: LeverSnapshot[]
}

// ─── RAG / Trend constants ────────────────────────────────────────────────

const RAG_OPTIONS: { value: RagStatus; label: string; color: string }[] = [
  { value: 'green', label: 'G', color: '#1FC881' },
  { value: 'amber', label: 'A', color: '#FFAB00' },
  { value: 'red',   label: 'R', color: '#D50000' },
]

const TREND_OPTIONS: { value: 'up' | 'flat' | 'down'; label: string }[] = [
  { value: 'up',   label: '↑' },
  { value: 'flat', label: '→' },
  { value: 'down', label: '↓' },
]

// ─── Component ────────────────────────────────────────────────────────────

export default function NorthStarUpdateForm({ section, sessionId, levers, snapshots }: Props) {
  // Build initial state from snapshots (falling back to live lever values)
  const snapshotMap = new Map(snapshots.map((s) => [s.lever_id, s]))

  const initState = (): Record<string, LeverState> => {
    const out: Record<string, LeverState> = {}
    for (const lever of levers) {
      const snap = snapshotMap.get(lever.id)
      out[lever.id] = {
        lever_id:      lever.id,
        current_state: snap?.current_state ?? lever.current_state,
        rag_status:    snap?.rag_status    ?? lever.rag_status,
        trend:         snap?.trend         ?? lever.trend,
        notes:         snap?.notes         ?? lever.notes ?? '',
      }
    }
    return out
  }

  const [states,  setStates]  = useState<Record<string, LeverState>>(initState)
  const [saving,     setSaving]     = useState<string | null>(null)   // lever_id being saved
  const [saved,      setSaved]      = useState<string | null>(null)
  const [saveError,  setSaveError]  = useState<string | null>(null)  // lever_id that errored
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  function update(leverId: string, patch: Partial<LeverState>) {
    setStates((prev) => ({ ...prev, [leverId]: { ...prev[leverId], ...patch } }))

    // Debounce save per lever
    clearTimeout(debounceRefs.current[leverId])
    debounceRefs.current[leverId] = setTimeout(() => {
      saveOne(leverId, { ...states[leverId], ...patch })
    }, 800)
  }

  const saveOne = useCallback(async (leverId: string, state: LeverState) => {
    setSaving(leverId); setSaveError(null)
    const supabase = getBrowserClient()

    const { error: delErr } = await supabase
      .from('lever_snapshots')
      .delete()
      .eq('session_id', sessionId)
      .eq('lever_id', leverId)

    if (delErr) {
      setSaving(null); setSaveError(leverId)
      setTimeout(() => setSaveError((e) => e === leverId ? null : e), 3000)
      return
    }

    const { error: insErr } = await supabase.from('lever_snapshots').insert({
      session_id:     sessionId,
      lever_id:       leverId,
      current_state:  state.current_state,
      rag_status:     state.rag_status,
      trend:          state.trend,
      notes:          state.notes || null,
      snapshotted_at: new Date().toISOString(),
    })

    if (insErr) {
      setSaving(null); setSaveError(leverId)
      setTimeout(() => setSaveError((e) => e === leverId ? null : e), 3000)
      return
    }

    setSaving(null)
    setSaved(leverId)
    setTimeout(() => setSaved((s) => s === leverId ? null : s), 2000)
  }, [sessionId])

  const groups = GROUPS.map(({ key, label }) => ({
    key,
    label,
    levers: levers.filter((l) => l.focus_area === key),
  })).filter((g) => g.levers.length > 0)

  return (
    <div className="px-8 py-10 space-y-12">
      {/* Global save indicator */}
      {(saving || saved || saveError) && (
        <div className={`fixed bottom-6 right-8 z-10 rounded-full px-4 py-2 text-[12px] shadow-md ${saveError ? 'bg-red text-white' : 'bg-[#262626] text-white'}`}>
          {saving ? 'Saving…' : saveError ? 'Save failed' : 'Saved ✓'}
        </div>
      )}

      {groups.map(({ key, label, levers: groupLevers }) => (
        <section key={key}>
          <p className="type-eyebrow text-[#2969FF] mb-5">{label}</p>
          <div className="space-y-3">
            {groupLevers.map((lever) => {
              const state = states[lever.id]
              if (!state) return null
              return (
                <LeverRow
                  key={lever.id}
                  lever={lever}
                  state={state}
                  isSaving={saving === lever.id}
                  isSaved={saved  === lever.id}
                  onChange={(patch) => update(lever.id, patch)}
                />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

// ─── Lever row ────────────────────────────────────────────────────────────

type LeverRowProps = {
  lever:    Lever
  state:    LeverState
  isSaving: boolean
  isSaved:  boolean
  onChange: (patch: Partial<LeverState>) => void
}

function LeverRow({ lever, state, isSaving, isSaved, onChange }: LeverRowProps) {
  const [expanded, setExpanded] = useState(false)

  const ragColor = { green: '#1FC881', amber: '#FFAB00', red: '#D50000' }[state.rag_status] ?? '#FFAB00'

  return (
    <div className="rounded-xl border border-[#DEDEDE] bg-white overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* RAG dot */}
        <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: ragColor }} />

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[#262626] truncate">{lever.name}</p>
          <p className="text-[11px] text-[#969696] truncate">{lever.owner}</p>
        </div>

        {/* Current state input */}
        <input
          type="text"
          value={state.current_state}
          onChange={(e) => onChange({ current_state: e.target.value })}
          className="w-28 rounded-lg border border-[#DEDEDE] bg-white px-2.5 py-1.5 text-[13px] text-[#262626] placeholder-[#969696] outline-none focus:border-[#2969FF] transition-colors"
          placeholder="Current…"
          aria-label={`Current value for ${lever.name}`}
        />

        {/* RAG buttons */}
        <div className="flex gap-1">
          {RAG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ rag_status: opt.value })}
              aria-label={`Set ${lever.name} RAG to ${opt.value}`}
              className={`h-7 w-7 rounded text-[11px] font-bold transition-all ${
                state.rag_status === opt.value
                  ? 'opacity-100 scale-110'
                  : 'opacity-25 hover:opacity-60'
              }`}
              style={{
                background: state.rag_status === opt.value ? opt.color + '33' : 'transparent',
                color:      opt.color,
                border:     `1px solid ${state.rag_status === opt.value ? opt.color : 'transparent'}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Trend buttons */}
        <div className="flex gap-1">
          {TREND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ trend: state.trend === opt.value ? null : opt.value })}
              aria-label={`Set ${lever.name} trend to ${opt.value}`}
              className={`h-7 w-7 rounded text-[14px] transition-all ${
                state.trend === opt.value
                  ? 'bg-[#2969FF]/10 text-[#2969FF]'
                  : 'text-[#969696] hover:bg-[#F7F7F7] hover:text-[#262626]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Save indicator */}
        <span className="w-12 text-right text-[11px] text-[#969696]">
          {isSaving ? '…' : isSaved ? '✓' : ''}
        </span>

        {/* Expand toggle (for notes) */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[#969696] hover:text-[#262626] transition-colors"
          aria-label={expanded ? 'Collapse notes' : 'Expand notes'}
        >
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path d="M2 4l5 6 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Notes area */}
      {expanded && (
        <div className="border-t border-[#DEDEDE] px-4 py-3">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5">
            Notes
          </label>
          <textarea
            value={state.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={3}
            placeholder="Context, blockers, next steps…"
            className="w-full resize-none rounded-lg border border-[#DEDEDE] bg-white px-3 py-2 text-[13px] text-[#262626] placeholder-[#969696] outline-none focus:border-[#2969FF] transition-colors"
          />
        </div>
      )}
    </div>
  )
}
