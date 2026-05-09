'use client'

import { useState, useCallback, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, Lever, LeverSnapshot, RagStatus, TeamMember, ImageItem } from '@/lib/types'
import { normaliseImages } from '@/lib/types'
import ImageUploader from '@/components/ImageUploader'
import TeamAvatar    from '@/components/TeamAvatar'

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
  lever_id:             string
  current_state:        string
  second_current_state: string
  rag_status:           RagStatus
  second_rag_status:    RagStatus
  trend:                'up' | 'flat' | 'down' | null
  second_trend:         'up' | 'flat' | 'down' | null
  notes:                string
  done_update:          string
  planning_update:      string
  images:               string[]
}

type Props = {
  section:     SessionSection
  sessionId:   string
  levers:      Lever[]
  snapshots:   LeverSnapshot[]
  teamMembers: TeamMember[]
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

export default function NorthStarUpdateForm({ section, sessionId, levers, snapshots, teamMembers }: Props) {
  const snapshotMap = new Map(snapshots.map((s) => [s.lever_id, s]))

  const initState = (): Record<string, LeverState> => {
    const out: Record<string, LeverState> = {}
    for (const lever of levers) {
      const snap = snapshotMap.get(lever.id)
      out[lever.id] = {
        lever_id:             lever.id,
        current_state:        snap?.current_state        ?? lever.current_state,
        second_current_state: snap?.second_current_state ?? lever.second_current_state ?? '',
        rag_status:           snap?.rag_status           ?? lever.rag_status,
        second_rag_status:    snap?.second_rag_status    ?? lever.rag_status,
        trend:                snap?.trend                ?? lever.trend,
        second_trend:         snap?.second_trend         ?? lever.trend,
        notes:                snap?.notes                ?? lever.notes ?? '',
        done_update:          snap?.done_update          ?? '',
        planning_update:      snap?.planning_update      ?? '',
        images:               snap?.images               ?? [],
      }
    }
    return out
  }

  const [states,        setStates]        = useState<Record<string, LeverState>>(initState)
  const [leverOwners,   setLeverOwners]   = useState<Record<string, string>>(
    Object.fromEntries(levers.map((l) => [l.id, l.owner ?? ''])),
  )
  const [leverMeasures, setLeverMeasures] = useState<Record<string, string>>(
    Object.fromEntries(levers.map((l) => [l.id, l.measure ?? ''])),
  )
  const [images,    setImages]    = useState<ImageItem[]>(
    normaliseImages(
      Array.isArray((section.content as { images?: unknown[] })?.images)
        ? (section.content as { images: (string | ImageItem)[] }).images
        : [],
    ),
  )
  const [saving,    setSaving]    = useState<string | null>(null)
  const [saved,     setSaved]     = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const pendingStates       = useRef<Record<string, LeverState>>({})
  const debounceRefs        = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const ownerDebounceRefs   = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const measureDebounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // ── Snapshot save ────────────────────────────────────────────────────────

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
      session_id:           sessionId,
      lever_id:             leverId,
      current_state:        state.current_state,
      second_current_state: state.second_current_state || null,
      rag_status:           state.rag_status,
      second_rag_status:    state.second_rag_status,
      trend:                state.trend,
      second_trend:         state.second_trend,
      notes:                state.notes           || null,
      done_update:          state.done_update     || null,
      planning_update:      state.planning_update || null,
      images:               state.images,
      snapshotted_at:       new Date().toISOString(),
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

  // ── Owner save ───────────────────────────────────────────────────────────

  const saveLeverOwner = useCallback(async (leverId: string, owner: string) => {
    setSaving(leverId); setSaveError(null)
    const { error: err } = await getBrowserClient()
      .from('levers')
      .update({ owner })
      .eq('id', leverId)
    if (err) {
      setSaving(null); setSaveError(leverId)
      setTimeout(() => setSaveError((e) => e === leverId ? null : e), 3000)
      return
    }
    setSaving(null)
    setSaved(leverId)
    setTimeout(() => setSaved((s) => s === leverId ? null : s), 2000)
  }, [])

  // ── Measure save ─────────────────────────────────────────────────────────

  const saveLeverMeasure = useCallback(async (leverId: string, measure: string) => {
    setSaving(leverId); setSaveError(null)
    const { error: err } = await getBrowserClient()
      .from('levers')
      .update({ measure })
      .eq('id', leverId)
    if (err) {
      setSaving(null); setSaveError(leverId)
      setTimeout(() => setSaveError((e) => e === leverId ? null : e), 3000)
      return
    }
    setSaving(null)
    setSaved(leverId)
    setTimeout(() => setSaved((s) => s === leverId ? null : s), 2000)
  }, [])

  // ── State update ─────────────────────────────────────────────────────────

  function update(leverId: string, patch: Partial<LeverState>) {
    setStates((prev) => {
      const merged = { ...prev[leverId], ...patch }
      pendingStates.current[leverId] = merged
      return { ...prev, [leverId]: merged }
    })
    clearTimeout(debounceRefs.current[leverId])
    debounceRefs.current[leverId] = setTimeout(() => {
      const latest = pendingStates.current[leverId]
      if (latest) saveOne(leverId, latest)
    }, 800)
  }

  function updateOwner(leverId: string, owner: string) {
    setLeverOwners((prev) => ({ ...prev, [leverId]: owner }))
    clearTimeout(ownerDebounceRefs.current[leverId])
    ownerDebounceRefs.current[leverId] = setTimeout(() => {
      saveLeverOwner(leverId, owner)
    }, 800)
  }

  function updateMeasure(leverId: string, measure: string) {
    setLeverMeasures((prev) => ({ ...prev, [leverId]: measure }))
    clearTimeout(measureDebounceRefs.current[leverId])
    measureDebounceRefs.current[leverId] = setTimeout(() => {
      saveLeverMeasure(leverId, measure)
    }, 800)
  }

  // ── Section images save ──────────────────────────────────────────────────

  async function saveImages(next: ImageItem[]) {
    await getBrowserClient()
      .from('session_sections')
      .update({ content: { images: next } })
      .eq('id', section.id)
  }

  const groups = GROUPS.map(({ key, label }) => ({
    key,
    label,
    levers: levers.filter((l) => l.focus_area === key),
  })).filter((g) => g.levers.length > 0)

  return (
    <div className="px-8 py-10 space-y-12">
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
                  leverOwner={leverOwners[lever.id] ?? lever.owner ?? ''}
                  leverMeasure={leverMeasures[lever.id] ?? lever.measure ?? ''}
                  teamMembers={teamMembers}
                  state={state}
                  isSaving={saving === lever.id}
                  isSaved={saved  === lever.id}
                  onChange={(patch) => update(lever.id, patch)}
                  onOwnerChange={(owner) => updateOwner(lever.id, owner)}
                  onMeasureChange={(measure) => updateMeasure(lever.id, measure)}
                />
              )
            })}
          </div>
        </section>
      ))}

      <section>
        <p className="type-eyebrow text-[#2969FF] mb-5">Images</p>
        <ImageUploader
          images={images}
          folder={`${sessionId}/${section.id}`}
          onChange={(imgs) => { setImages(imgs); saveImages(imgs) }}
        />
      </section>
    </div>
  )
}

// ─── Lever row ────────────────────────────────────────────────────────────

type LeverRowProps = {
  lever:           Lever
  leverOwner:      string
  leverMeasure:    string
  teamMembers:     TeamMember[]
  state:           LeverState
  isSaving:        boolean
  isSaved:         boolean
  onChange:        (patch: Partial<LeverState>) => void
  onOwnerChange:   (owner: string) => void
  onMeasureChange: (measure: string) => void
}

function LeverRow({ lever, leverOwner, leverMeasure, teamMembers, state, isSaving, isSaved, onChange, onOwnerChange, onMeasureChange }: LeverRowProps) {
  const [expanded, setExpanded] = useState(false)

  const ragColor    = { green: '#1FC881', amber: '#FFAB00', red: '#D50000' }[state.rag_status] ?? '#FFAB00'
  const ownerMember = teamMembers.find((m) => m.name === leverOwner)

  const expandBtn = (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="text-[#969696] hover:text-[#262626] transition-colors"
      aria-label={expanded ? 'Collapse' : 'Expand to edit details'}
    >
      <svg
        width="14" height="14" viewBox="0 0 14 14" fill="none"
        className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        aria-hidden="true"
      >
        <path d="M2 4l5 6 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )

  return (
    <div className="rounded-xl border border-[#DEDEDE] bg-white overflow-hidden">

      {lever.second_measure ? (
        /* ── Dual-measure: metric rows on the right, matching single-measure alignment ── */
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: ragColor }} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#262626] truncate">{lever.name}</p>
            <p className="text-[11px] text-[#969696] truncate">{leverOwner || lever.owner}</p>
          </div>

          {/* Two metric rows stacked where the single input normally sits */}
          <div className="flex flex-col gap-1.5">
            <MetricControls
              label="% coverage"
              current={state.current_state}
              ragStatus={state.rag_status}
              trend={state.trend}
              onCurrent={(v) => onChange({ current_state: v })}
              onRag={(v) => onChange({ rag_status: v })}
              onTrend={(v) => onChange({ trend: v })}
            />
            <MetricControls
              label={lever.second_measure}
              current={state.second_current_state}
              ragStatus={state.second_rag_status}
              trend={state.second_trend}
              onCurrent={(v) => onChange({ second_current_state: v })}
              onRag={(v) => onChange({ second_rag_status: v })}
              onTrend={(v) => onChange({ second_trend: v })}
            />
          </div>

          <span className="w-12 text-right text-[11px] text-[#969696]">
            {isSaving ? '…' : isSaved ? '✓' : ''}
          </span>
          {expandBtn}
        </div>
      ) : (
        /* ── Single-measure: standard flat header row ── */
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: ragColor }} />

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#262626] truncate">{lever.name}</p>
            <p className="text-[11px] text-[#969696] truncate">{leverOwner || lever.owner}</p>
          </div>

          <input
            type="text"
            value={state.current_state}
            onChange={(e) => onChange({ current_state: e.target.value })}
            className="w-28 rounded-lg border border-[#DEDEDE] bg-white px-2.5 py-1.5 text-[13px] text-[#262626] placeholder-[#969696] outline-none focus:border-[#2969FF] transition-colors"
            placeholder="Current…"
            aria-label={`Current value for ${lever.name}`}
          />

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

          <span className="w-12 text-right text-[11px] text-[#969696]">
            {isSaving ? '…' : isSaved ? '✓' : ''}
          </span>

          {expandBtn}
        </div>
      )}

      {/* Expanded edit block */}
      {expanded && (
        <div className="border-t border-[#DEDEDE] divide-y divide-[#DEDEDE]">

          {/* ── Owner ─────────────────────────────────────────────────── */}
          <div className="flex flex-col px-4 py-3">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5">
              Owner
            </label>
            <div className="flex items-center gap-3">
              <TeamAvatar member={ownerMember} size={36} className="border border-[#DEDEDE]" />
              <select
                value={leverOwner}
                onChange={(e) => onOwnerChange(e.target.value)}
                className="w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2 text-[13px] text-[#262626] outline-none focus:border-[#2969FF] transition-colors appearance-none"
              >
                <option value="">— select owner —</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Measure ───────────────────────────────────────────────── */}
          <div className="flex flex-col px-4 py-3">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5">
              Measure
            </label>
            <input
              type="text"
              value={leverMeasure}
              onChange={(e) => onMeasureChange(e.target.value)}
              placeholder="How we measure this lever…"
              className="w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2 text-[13px] text-[#262626] placeholder-[#969696] outline-none focus:border-[#2969FF] transition-colors"
            />
          </div>

          {/* ── What have we done ─────────────────────────────────────── */}
          <div className="flex flex-col px-4 py-3">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5">
              What have we done to move the needle?
            </label>
            <textarea
              value={state.done_update}
              onChange={(e) => onChange({ done_update: e.target.value })}
              rows={3}
              placeholder="One item per line…"
              className="w-full resize-none rounded-lg border border-[#DEDEDE] bg-white px-3 py-2 text-[13px] text-[#262626] placeholder-[#969696] outline-none focus:border-[#2969FF] transition-colors"
            />
          </div>

          {/* ── What are we planning ──────────────────────────────────── */}
          <div className="flex flex-col px-4 py-3">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5">
              What are we planning?
            </label>
            <textarea
              value={state.planning_update}
              onChange={(e) => onChange({ planning_update: e.target.value })}
              rows={3}
              placeholder="One item per line…"
              className="w-full resize-none rounded-lg border border-[#DEDEDE] bg-white px-3 py-2 text-[13px] text-[#262626] placeholder-[#969696] outline-none focus:border-[#2969FF] transition-colors"
            />
          </div>

          {/* ── Lever images ──────────────────────────────────────────── */}
          <div className="flex flex-col px-4 py-3">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5">
              Images (up to 3)
            </label>
            <ImageUploader
              images={normaliseImages(state.images)}
              folder={`lever-images/${lever.id}`}
              onChange={(imgs) => onChange({ images: imgs.slice(0, 3).map((i) => i.url) })}
            />
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Metric controls — reused for each metric row in dual-measure levers ─

function MetricControls({
  label, current, ragStatus, trend, onCurrent, onRag, onTrend,
}: {
  label:     string
  current:   string
  ragStatus: RagStatus
  trend:     'up' | 'flat' | 'down' | null
  onCurrent: (v: string) => void
  onRag:     (v: RagStatus) => void
  onTrend:   (v: 'up' | 'flat' | 'down' | null) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-[11px] text-[#969696] w-36 shrink-0 text-right">{label}</p>
      <input
        type="text"
        value={current}
        onChange={(e) => onCurrent(e.target.value)}
        className="w-24 rounded-lg border border-[#DEDEDE] bg-white px-2.5 py-1.5 text-[13px] text-[#262626] placeholder-[#969696] outline-none focus:border-[#2969FF] transition-colors"
        placeholder="Current…"
      />
      <div className="flex gap-1">
        {RAG_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onRag(opt.value)}
            className={`h-7 w-7 rounded text-[11px] font-bold transition-all ${
              ragStatus === opt.value ? 'opacity-100 scale-110' : 'opacity-25 hover:opacity-60'
            }`}
            style={{
              background: ragStatus === opt.value ? opt.color + '33' : 'transparent',
              color:      opt.color,
              border:     `1px solid ${ragStatus === opt.value ? opt.color : 'transparent'}`,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        {TREND_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onTrend(trend === opt.value ? null : opt.value)}
            className={`h-7 w-7 rounded text-[14px] transition-all ${
              trend === opt.value
                ? 'bg-[#2969FF]/10 text-[#2969FF]'
                : 'text-[#969696] hover:bg-[#F7F7F7] hover:text-[#262626]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
