'use client'

import { useState, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember, ImageItem } from '@/lib/types'
import { normaliseImages } from '@/lib/types'
import RichTextEditor from '@/components/RichTextEditor'
import ImageUploader  from '@/components/ImageUploader'
import TeamAvatar     from '@/components/TeamAvatar'

// ─── Shared field styles ──────────────────────────────────────────────────

const fieldLabel = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const selectCls  = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] outline-none transition-colors focus:border-[#2969FF] appearance-none'

// ─── Types ────────────────────────────────────────────────────────────────

type Content = {
  presenter_id:   string
  presenter_id_2: string
  subject_id:     string
  spotlight:      string
  images:         ImageItem[]
}

type Props = {
  section:     SessionSection
  sessionId:   string
  teamMembers: TeamMember[]
}

// ─── Component ────────────────────────────────────────────────────────────

export default function JustHumansForm({ section, sessionId, teamMembers }: Props) {
  const raw = section.content as Partial<Content>

  const [presenter_id,   setPresenter]  = useState(raw.presenter_id   ?? '')
  const [presenter_id_2, setPresenter2] = useState(raw.presenter_id_2 ?? '')
  const [subject_id,     setSubject]    = useState(raw.subject_id     ?? '')
  const [spotlight,      setSpotlight]  = useState(raw.spotlight      ?? '')
  const [images,         setImages]     = useState<ImageItem[]>(
    normaliseImages((raw.images ?? []) as (string | ImageItem)[]),
  )
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [saveError, setSaveError] = useState(false)

  const save = useCallback(async (patch: Partial<Content>) => {
    setSaving(true); setSaved(false); setSaveError(false)
    const content: Content = {
      presenter_id:   patch.presenter_id   ?? presenter_id,
      presenter_id_2: patch.presenter_id_2 ?? presenter_id_2,
      subject_id:     patch.subject_id     ?? subject_id,
      spotlight:      patch.spotlight      ?? spotlight,
      images:         patch.images         ?? images,
    }
    const { error: err } = await getBrowserClient()
      .from('session_sections')
      .update({ content })
      .eq('id', section.id)
    if (err) {
      setSaving(false); setSaveError(true)
      setTimeout(() => setSaveError(false), 3000)
      return
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [presenter_id, presenter_id_2, subject_id, spotlight, images, section.id])

  const subject = teamMembers.find((m) => m.id === subject_id)

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 space-y-8">
      <SaveIndicator saving={saving} saved={saved} error={saveError} />

      {/* Presenters */}
      <div>
        <label className={fieldLabel}>Presenters</label>
        <div className="space-y-3">
          <div>
            <p className="text-[11px] text-[#969696] mb-1.5">Presenter 1</p>
            <div className="flex items-center gap-3">
              <TeamAvatar member={teamMembers.find((m) => m.id === presenter_id)} size={36} className="border border-[#DEDEDE]" />
              <select
                value={presenter_id}
                onChange={(e) => { setPresenter(e.target.value); save({ presenter_id: e.target.value }) }}
                className={selectCls}
              >
                <option value="">— select —</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-[#969696] mb-1.5">Presenter 2 (optional)</p>
            <div className="flex items-center gap-3">
              <TeamAvatar member={teamMembers.find((m) => m.id === presenter_id_2)} size={36} className="border border-[#DEDEDE]" />
              <select
                value={presenter_id_2}
                onChange={(e) => { setPresenter2(e.target.value); save({ presenter_id_2: e.target.value }) }}
                className={selectCls}
              >
                <option value="">— none —</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className={fieldLabel}>Spotlight on</label>
        <div className="flex items-center gap-3">
          <TeamAvatar member={subject} size={36} className="border border-[#DEDEDE]" />
          <select
            value={subject_id}
            onChange={(e) => { setSubject(e.target.value); save({ subject_id: e.target.value }) }}
            className={selectCls}
          >
            <option value="">— select —</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Spotlight content */}
      <div>
        <label className={fieldLabel}>Spotlight content</label>
        <RichTextEditor
          value={spotlight}
          onChange={(html) => { setSpotlight(html); save({ spotlight: html }) }}
          placeholder="Fun facts, achievements, personal highlights…"
          minHeight={160}
        />
      </div>

      {/* Images */}
      <div>
        <label className={fieldLabel}>Images</label>
        <ImageUploader
          images={images}
          folder={`${sessionId}/${section.id}`}
          onChange={(imgs) => { setImages(imgs); save({ images: imgs }) }}
        />
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function SaveIndicator({ saving, saved, error }: { saving: boolean; saved: boolean; error: boolean }) {
  if (!saving && !saved && !error) return null
  return (
    <div className={`fixed bottom-6 right-8 z-10 rounded-full px-4 py-2 text-[12px] shadow-md ${error ? 'bg-red text-white' : 'bg-[#262626] text-white'}`}>
      {saving ? 'Saving…' : error ? 'Save failed' : 'Saved ✓'}
    </div>
  )
}
