'use client'

import { useState, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember, ImageAlign } from '@/lib/types'
import TeamAvatar from '@/components/TeamAvatar'

// ─── Shared styles ────────────────────────────────────────────────────────

const fieldLabel = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls   = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'
const selectCls  = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] outline-none transition-colors focus:border-[#2969FF] appearance-none'

// ─── Types ────────────────────────────────────────────────────────────────

type AnnouncementItem = {
  text:      string
  url:       string
  image_url: string
}

type Content = {
  presenter_id:   string
  presenter_id_2: string
  items:          AnnouncementItem[]
}

type Props = {
  section:     SessionSection
  sessionId:   string
  teamMembers: TeamMember[]
}

// ─── Component ────────────────────────────────────────────────────────────

export default function AnnouncementsForm({ section, sessionId, teamMembers }: Props) {
  const raw = section.content as Partial<Content>

  const [presenter_id,   setPresenter]  = useState(raw.presenter_id   ?? '')
  const [presenter_id_2, setPresenter2] = useState(raw.presenter_id_2 ?? '')
  const [items, setItems]               = useState<AnnouncementItem[]>(
    (raw.items ?? []).length > 0
      ? (raw.items as AnnouncementItem[])
      : [{ text: '', url: '', image_url: '' }],
  )
  const [uploading,  setUploading]  = useState<number | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [saveError,  setSaveError]  = useState(false)

  const persist = useCallback(async (patch: Partial<Content>) => {
    setSaving(true); setSaved(false); setSaveError(false)
    const content: Content = {
      presenter_id:   patch.presenter_id   ?? presenter_id,
      presenter_id_2: patch.presenter_id_2 ?? presenter_id_2,
      items:          patch.items          ?? items,
    }
    const { error: err } = await getBrowserClient()
      .from('session_sections')
      .update({ content })
      .eq('id', section.id)
    if (err) { setSaving(false); setSaveError(true); setTimeout(() => setSaveError(false), 3000); return }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [presenter_id, presenter_id_2, items, section.id])

  function updateItem(i: number, field: keyof AnnouncementItem, value: string) {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: value } : item)
    setItems(next)
    persist({ items: next })
  }

  async function handleItemImage(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(i)
    const path = `${sessionId}/${section.id}/item-${i}-${Date.now()}-${file.name}`
    const supabase = getBrowserClient()
    const { data } = await supabase.storage.from('session-images').upload(path, file, { upsert: true })
    if (data) {
      const { data: pub } = supabase.storage.from('session-images').getPublicUrl(data.path)
      updateItem(i, 'image_url', pub.publicUrl)
    }
    setUploading(null)
  }

  async function removeItemImage(i: number, url: string) {
    const storagePath = url.split('/session-images/')[1]
    if (storagePath) {
      await getBrowserClient().storage.from('session-images').remove([storagePath])
    }
    updateItem(i, 'image_url', '')
  }

  function addItem()         { setItems((prev) => [...prev, { text: '', url: '', image_url: '' }]) }
  function removeItem(i: number) {
    const next = items.filter((_, idx) => idx !== i)
    setItems(next); persist({ items: next })
  }

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
                onChange={(e) => { setPresenter(e.target.value); persist({ presenter_id: e.target.value }) }}
                className={selectCls}
              >
                <option value="">— select —</option>
                {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-[#969696] mb-1.5">Presenter 2 (optional)</p>
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

      {/* Announcement items */}
      <div>
        <label className={fieldLabel}>Announcements</label>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#DEDEDE] bg-white p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="type-eyebrow text-[#969696] mt-0.5">#{i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="flex-shrink-0 text-[#969696] hover:text-red transition-colors"
                  aria-label="Remove announcement"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Text */}
              <input
                type="text"
                value={item.text}
                onChange={(e) => { const v = e.target.value; setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, text: v } : it)) }}
                onBlur={() => persist({})}
                placeholder="Announcement text…"
                className={inputCls}
              />

              {/* URL */}
              <input
                type="url"
                value={item.url}
                onChange={(e) => { const v = e.target.value; setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, url: v } : it)) }}
                onBlur={() => persist({})}
                placeholder="Link URL (optional)"
                className={inputCls}
              />

              {/* Per-item image */}
              <div>
                {item.image_url ? (
                  <div className="relative mb-2 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url} alt="" className="max-h-32 rounded-lg object-cover border border-[#DEDEDE]" />
                    <button
                      type="button"
                      onClick={() => removeItemImage(i, item.image_url)}
                      aria-label="Remove image"
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                        <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#969696] hover:text-[#5A5A5A] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {uploading === i ? 'Uploading…' : 'Add card image'}
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleItemImage(i, e)} />
                  </label>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="text-[12px] text-primary/60 hover:text-primary transition-colors"
          >
            + Add announcement
          </button>
        </div>
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
