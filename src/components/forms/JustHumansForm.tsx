'use client'

import { useState, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember } from '@/lib/types'
import RichTextEditor from '@/components/RichTextEditor'
import ImageUploader  from '@/components/ImageUploader'

// ─── Shared field styles ──────────────────────────────────────────────────

const fieldLabel = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const selectCls  = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] outline-none transition-colors focus:border-[#2969FF] appearance-none'

// ─── Types ────────────────────────────────────────────────────────────────

type Content = {
  presenter_id: string
  subject_id:   string
  spotlight:    string
  images:       string[]
}

type Props = {
  section:     SessionSection
  sessionId:   string
  teamMembers: TeamMember[]
}

// ─── Component ────────────────────────────────────────────────────────────

export default function JustHumansForm({ section, sessionId, teamMembers }: Props) {
  const raw = section.content as Partial<Content>

  const [presenter_id, setPresenter] = useState(raw.presenter_id ?? '')
  const [subject_id,   setSubject]   = useState(raw.subject_id   ?? '')
  const [spotlight,    setSpotlight] = useState(raw.spotlight    ?? '')
  const [images,       setImages]    = useState<string[]>(raw.images ?? [])
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [saveError,  setSaveError]  = useState(false)

  const save = useCallback(async (patch: Partial<Content>) => {
    setSaving(true); setSaved(false); setSaveError(false)
    const content: Content = {
      presenter_id: patch.presenter_id ?? presenter_id,
      subject_id:   patch.subject_id   ?? subject_id,
      spotlight:    patch.spotlight    ?? spotlight,
      images:       patch.images       ?? images,
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
  }, [presenter_id, subject_id, spotlight, images, section.id])

  const presenter = teamMembers.find((m) => m.id === presenter_id)
  const subject   = teamMembers.find((m) => m.id === subject_id)

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 space-y-8">
      <SaveIndicator saving={saving} saved={saved} error={saveError} />

      {/* Presenter */}
      <div>
        <label className={fieldLabel}>Presenter</label>
        <div className="flex items-center gap-3">
          <MemberAvatar member={presenter} />
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

      {/* Subject */}
      <div>
        <label className={fieldLabel}>Spotlight on</label>
        <div className="flex items-center gap-3">
          <MemberAvatar member={subject} />
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

function MemberAvatar({ member }: { member: TeamMember | undefined }) {
  if (!member) {
    return (
      <div className="h-9 w-9 flex-shrink-0 rounded-full bg-[#F0F0F0] border border-[#DEDEDE]" />
    )
  }
  if (member.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.photo_url}
        alt={member.name}
        className="h-9 w-9 flex-shrink-0 rounded-full object-cover border border-[#DEDEDE]"
      />
    )
  }
  return (
    <div className="h-9 w-9 flex-shrink-0 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[13px] font-bold text-primary">
      {member.name[0]}
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
