'use client'

import { useState, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember } from '@/lib/types'
import RichTextEditor from '@/components/RichTextEditor'
import ImageUploader  from '@/components/ImageUploader'
import TeamAvatar     from '@/components/TeamAvatar'

// ─── Shared styles ────────────────────────────────────────────────────────

const fieldLabel  = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls    = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'
const selectCls   = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] outline-none transition-colors focus:border-[#2969FF] appearance-none'
const textareaCls = `${inputCls} resize-none`

// ─── Types ────────────────────────────────────────────────────────────────

type Content = {
  presenter_id: string
  topic:        string
  duration_min: number
  demo_url:     string
  body:         string
  watch_for:    string
  images:       string[]
}

type Props = {
  section:     SessionSection
  sessionId:   string
  teamMembers: TeamMember[]
}

// ─── Component ────────────────────────────────────────────────────────────

export default function ShowAndTellForm({ section, sessionId, teamMembers }: Props) {
  const raw = section.content as Partial<Content>

  const [is_active,    setIsActive]    = useState(section.is_active)
  const [presenter_id, setPresenter]   = useState(raw.presenter_id ?? '')
  const [topic,        setTopic]       = useState(raw.topic        ?? '')
  const [duration_min, setDuration]    = useState<number>(raw.duration_min ?? 10)
  const [demo_url,     setDemoUrl]     = useState(raw.demo_url     ?? '')
  const [body,         setBody]        = useState(raw.body         ?? '')
  const [watch_for,    setWatchFor]    = useState(raw.watch_for    ?? '')
  const [images,       setImages]      = useState<string[]>(raw.images ?? [])
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [saveError, setSaveError] = useState(false)

  const persist = useCallback(async (patch: Partial<Content & { is_active?: boolean }>) => {
    setSaving(true); setSaved(false); setSaveError(false)
    const content: Content = {
      presenter_id: patch.presenter_id ?? presenter_id,
      topic:        patch.topic        ?? topic,
      duration_min: patch.duration_min ?? duration_min,
      demo_url:     patch.demo_url     ?? demo_url,
      body:         patch.body         ?? body,
      watch_for:    patch.watch_for    ?? watch_for,
      images:       patch.images       ?? images,
    }
    const active = patch.is_active !== undefined ? patch.is_active : is_active
    const { error: err } = await getBrowserClient()
      .from('session_sections')
      .update({ content, is_active: active })
      .eq('id', section.id)
    if (err) { setSaving(false); setSaveError(true); setTimeout(() => setSaveError(false), 3000); return }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [presenter_id, topic, duration_min, demo_url, body, watch_for, images, is_active, section.id])

  function toggleActive() {
    const next = !is_active
    setIsActive(next)
    persist({ is_active: next })
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 space-y-8">
      <SaveIndicator saving={saving} saved={saved} error={saveError} />

      {/* Active toggle */}
      <div className="flex items-center justify-between rounded-xl border border-[#DEDEDE] bg-white px-5 py-4">
        <div>
          <p className="text-[14px] font-medium text-[#262626]">Include in this session</p>
          <p className="text-[12px] text-[#5A5A5A]">Toggle off to skip Show &amp; Tell this week</p>
        </div>
        <button
          type="button"
          onClick={toggleActive}
          className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${is_active ? 'bg-primary' : 'bg-[#DEDEDE]'}`}
          role="switch"
          aria-checked={is_active}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${is_active ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      {!is_active && (
        <p className="text-[13px] text-[#969696] italic">This section is currently hidden from the presentation.</p>
      )}

      {/* Presenter */}
      <div>
        <label className={fieldLabel}>Presenter</label>
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

      {/* Topic */}
      <div>
        <label className={fieldLabel}>Topic</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onBlur={() => persist({ topic })}
          placeholder="What are you showing?"
          className={inputCls}
        />
      </div>

      {/* Duration */}
      <div>
        <label className={fieldLabel}>Duration (minutes)</label>
        <input
          type="number"
          value={duration_min}
          min={1}
          max={60}
          onChange={(e) => setDuration(Number(e.target.value))}
          onBlur={() => persist({ duration_min })}
          className={`${inputCls} w-32`}
        />
      </div>

      {/* Demo URL */}
      <div>
        <label className={fieldLabel}>Demo URL (optional)</label>
        <input
          type="url"
          value={demo_url}
          onChange={(e) => setDemoUrl(e.target.value)}
          onBlur={() => persist({ demo_url })}
          placeholder="https://…"
          className={inputCls}
        />
      </div>

      {/* Body (rich text with table support) */}
      <div>
        <label className={fieldLabel}>Content</label>
        <RichTextEditor
          value={body}
          onChange={(html) => { setBody(html); persist({ body: html }) }}
          placeholder="Context, background, key points…"
          minHeight={160}
          showTable
        />
      </div>

      {/* Watch for */}
      <div>
        <label className={fieldLabel}>What to watch for</label>
        <textarea
          value={watch_for}
          onChange={(e) => setWatchFor(e.target.value)}
          onBlur={() => persist({ watch_for })}
          placeholder="Highlight key moments or things for the team to pay attention to…"
          rows={4}
          className={textareaCls}
        />
      </div>

      {/* Images */}
      <div>
        <label className={fieldLabel}>Images</label>
        <ImageUploader
          images={images}
          folder={`${sessionId}/${section.id}`}
          onChange={(imgs) => { setImages(imgs); persist({ images: imgs }) }}
        />
      </div>
    </div>
  )
}

function SaveIndicator({ saving, saved, error }: { saving: boolean; saved: boolean; error: boolean }) {
  if (!saving && !saved && !error) return null
  return (
    <div className={`fixed bottom-6 right-8 z-10 rounded-full px-4 py-2 text-[12px] shadow-md ${error ? 'bg-red text-white' : 'bg-[#262626] text-white'}`}>
      {saving ? 'Saving…' : error ? 'Save failed' : 'Saved ✓'}
    </div>
  )
}
