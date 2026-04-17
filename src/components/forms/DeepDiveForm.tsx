'use client'

import { useState, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember, Lever } from '@/lib/types'
import TeamAvatar   from '@/components/TeamAvatar'
import BlockEditor  from '@/components/blocks/BlockEditor'
import type { Block } from '@/components/blocks/BlockTypes'

// ─── Shared styles ────────────────────────────────────────────────────────

const fieldLabel = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls   = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'
const selectCls  = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] outline-none transition-colors focus:border-[#2969FF] appearance-none'

// ─── Types ────────────────────────────────────────────────────────────────

type Content = {
  title:          string
  presenter_id:   string
  presenter_id_2: string
  lever_id:       string
  blocks:         Block[]
}

type Props = {
  section:     SessionSection
  sessionId:   string
  teamMembers: TeamMember[]
  levers:      Lever[]
}

// ─── Focus area labels for grouping ──────────────────────────────────────

const FOCUS_LABELS: Record<string, string> = {
  north_star:            'North Star',
  grow_client_base:      'Grow Our Client Base',
  increase_client_value: 'Increase Client Value',
  returns_to_scale:      'Returns to Scale',
  enablers:              'Enablers',
}

// ─── Component ────────────────────────────────────────────────────────────

export default function DeepDiveForm({ section, sessionId, teamMembers, levers }: Props) {
  const raw = section.content as Partial<Content>

  const [is_active,      setIsActive]   = useState(section.is_active)
  const [title,          setTitle]      = useState(raw.title          ?? '')
  const [presenter_id,   setPresenter]  = useState(raw.presenter_id   ?? '')
  const [presenter_id_2, setPresenter2] = useState(raw.presenter_id_2 ?? '')
  const [lever_id,       setLever]      = useState(raw.lever_id       ?? '')
  const [blocks,         setBlocks]     = useState<Block[]>(raw.blocks ?? [])
  const [saving,         setSaving]     = useState(false)
  const [saved,          setSaved]      = useState(false)
  const [saveError,      setSaveError]  = useState(false)

  const persist = useCallback(async (patch: Partial<Content & { is_active?: boolean }>) => {
    setSaving(true); setSaved(false); setSaveError(false)
    const content: Content = {
      title:          patch.title          ?? title,
      presenter_id:   patch.presenter_id   ?? presenter_id,
      presenter_id_2: patch.presenter_id_2 ?? presenter_id_2,
      lever_id:       patch.lever_id       ?? lever_id,
      blocks:         patch.blocks         ?? blocks,
    }
    const active = patch.is_active !== undefined ? patch.is_active : is_active
    const { error: err } = await getBrowserClient()
      .from('session_sections')
      .update({ content, is_active: active })
      .eq('id', section.id)
    if (err) { setSaving(false); setSaveError(true); setTimeout(() => setSaveError(false), 3000); return }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [title, presenter_id, presenter_id_2, lever_id, blocks, is_active, section.id])

  function toggleActive() {
    const next = !is_active
    setIsActive(next)
    persist({ is_active: next })
  }

  // Group levers by focus area
  const leverGroups = Object.entries(FOCUS_LABELS).map(([key, label]) => ({
    key, label,
    levers: levers.filter((l) => l.focus_area === key),
  })).filter((g) => g.levers.length > 0)

  return (
    <div>
      <SaveIndicator saving={saving} saved={saved} error={saveError} />

      {/* ── Top metadata fields ───────────────────────────────────── */}
      <div className="mx-auto w-full max-w-2xl space-y-8 px-8 py-8">

        {/* Active toggle */}
        <div className="flex items-center justify-between rounded-xl border border-[#DEDEDE] bg-white px-5 py-4">
          <div>
            <p className="text-[14px] font-medium text-[#262626]">Include in this session</p>
            <p className="text-[12px] text-[#5A5A5A]">Toggle off to skip Deep Dive this week</p>
          </div>
          <button
            type="button"
            onClick={toggleActive}
            className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${is_active ? 'bg-primary' : 'bg-[#DEDEDE]'}`}
            role="switch"
            aria-checked={is_active}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {!is_active && (
          <p className="text-[13px] italic text-[#969696]">This section is currently hidden from the presentation.</p>
        )}

        {/* Title */}
        <div className="flex flex-col">
          <label className={fieldLabel}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); persist({ title: e.target.value }) }}
            placeholder="Deep dive topic…"
            className={inputCls}
          />
        </div>

        {/* Presenters */}
        <div className="flex flex-col">
          <label className={fieldLabel}>Presenters</label>
          <div className="space-y-3">
            <div className="flex flex-col">
              <p className="mb-1.5 text-[11px] text-[#969696]">Presenter 1</p>
              <div className="flex items-center gap-3">
                <TeamAvatar member={teamMembers.find((m) => m.id === presenter_id)} size={36} className="border border-[#DEDEDE]" />
                <select
                  value={presenter_id}
                  onChange={(e) => { setPresenter(e.target.value); persist({ presenter_id: e.target.value }) }}
                  className={selectCls}
                >
                  <option value="">— select —</option>
                  {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col">
              <p className="mb-1.5 text-[11px] text-[#969696]">Presenter 2 (optional)</p>
              <div className="flex items-center gap-3">
                <TeamAvatar member={teamMembers.find((m) => m.id === presenter_id_2)} size={36} className="border border-[#DEDEDE]" />
                <select
                  value={presenter_id_2}
                  onChange={(e) => { setPresenter2(e.target.value); persist({ presenter_id_2: e.target.value }) }}
                  className={selectCls}
                >
                  <option value="">— none —</option>
                  {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Linked lever */}
        <div className="flex flex-col">
          <label className={fieldLabel}>Linked lever (optional)</label>
          <select
            value={lever_id}
            onChange={(e) => { setLever(e.target.value); persist({ lever_id: e.target.value }) }}
            className={selectCls}
          >
            <option value="">— none —</option>
            {leverGroups.map((g) => (
              <optgroup key={g.key} label={g.label}>
                {g.levers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* ── Block editor ──────────────────────────────────────────── */}
      <div className="mx-8 border-t border-[#E2E2E2]" />
      <BlockEditor
        content={{ title, blocks, enabled: is_active }}
        onChange={(c) => {
          setBlocks(c.blocks)
          persist({ blocks: c.blocks })
        }}
        folder={`${sessionId}/${section.id}`}
      />
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
