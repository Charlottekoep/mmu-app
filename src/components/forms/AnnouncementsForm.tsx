'use client'

import { useState, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember } from '@/lib/types'

// ─── Shared styles ────────────────────────────────────────────────────────

const fieldLabel = 'block text-[11px] font-bold uppercase tracking-widest text-white/30 mb-1.5'
const inputCls   = 'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[14px] text-white placeholder-white/20 outline-none transition-colors focus:border-primary/50'
const selectCls  = 'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[14px] text-white outline-none transition-colors focus:border-primary/50 appearance-none'

// ─── Types ────────────────────────────────────────────────────────────────

type AnnouncementItem = {
  text:      string
  url:       string
  image_url: string
}

type Content = {
  presenter_id: string
  items:        AnnouncementItem[]
}

type Props = {
  section:     SessionSection
  sessionId:   string
  teamMembers: TeamMember[]
}

// ─── Component ────────────────────────────────────────────────────────────

export default function AnnouncementsForm({ section, teamMembers }: Props) {
  const raw = section.content as Partial<Content>

  const [presenter_id, setPresenter] = useState(raw.presenter_id ?? '')
  const [items, setItems]            = useState<AnnouncementItem[]>(
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
      presenter_id: patch.presenter_id ?? presenter_id,
      items:        patch.items        ?? items,
    }
    const { error: err } = await getBrowserClient()
      .from('session_sections')
      .update({ content })
      .eq('id', section.id)
    if (err) { setSaving(false); setSaveError(true); setTimeout(() => setSaveError(false), 3000); return }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [presenter_id, items, section.id])

  function updateItem(i: number, field: keyof AnnouncementItem, value: string) {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: value } : item)
    setItems(next)
    persist({ items: next })
  }

  async function handleImage(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(i)
    const path = `announcements/${section.id}/${Date.now()}-${file.name}`
    const supabase = getBrowserClient()
    const { data } = await supabase.storage.from('mmu-uploads').upload(path, file, { upsert: true })
    if (data) {
      const { data: pub } = supabase.storage.from('mmu-uploads').getPublicUrl(data.path)
      updateItem(i, 'image_url', pub.publicUrl)
    }
    setUploading(null)
  }

  function addItem()         { setItems((prev) => [...prev, { text: '', url: '', image_url: '' }]) }
  function removeItem(i: number) {
    const next = items.filter((_, idx) => idx !== i)
    setItems(next); persist({ items: next })
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 space-y-8">
      <SaveIndicator saving={saving} saved={saved} error={saveError} />

      {/* Presenter */}
      <div>
        <label className={fieldLabel}>Presenter</label>
        <select
          value={presenter_id}
          onChange={(e) => { setPresenter(e.target.value); persist({ presenter_id: e.target.value }) }}
          className={selectCls}
        >
          <option value="">— select —</option>
          {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Announcement items */}
      <div>
        <label className={fieldLabel}>Announcements</label>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="type-eyebrow text-white/20 mt-0.5">#{i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="flex-shrink-0 text-white/20 hover:text-red transition-colors"
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

              {/* Image */}
              <div>
                {item.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt="" className="mb-2 max-h-32 rounded-lg object-cover border border-white/10" />
                )}
                <label className="flex cursor-pointer items-center gap-2 text-[12px] text-white/30 hover:text-white/50 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {uploading === i ? 'Uploading…' : 'Add image'}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleImage(i, e)} />
                </label>
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
    <div className={`fixed bottom-6 right-8 z-10 rounded-full px-4 py-2 text-[12px] backdrop-blur-sm ${error ? 'bg-red/20 text-red' : 'bg-white/10 text-white/60'}`}>
      {saving ? 'Saving…' : error ? 'Save failed' : 'Saved ✓'}
    </div>
  )
}
