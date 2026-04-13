'use client'

import { useState, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember, Lever } from '@/lib/types'
import RichTextEditor from '@/components/RichTextEditor'

// ─── Shared styles ────────────────────────────────────────────────────────

const fieldLabel = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls   = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'
const selectCls  = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] outline-none transition-colors focus:border-[#2969FF] appearance-none'

// ─── Types ────────────────────────────────────────────────────────────────

type LinkItem = { url: string; label: string }

type Content = {
  title:        string
  presenter_id: string
  lever_id:     string
  body:         string
  links:        LinkItem[]
  image_url:    string
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

export default function DeepDiveForm({ section, teamMembers, levers }: Props) {
  const raw = section.content as Partial<Content>

  const [title,        setTitle]        = useState(raw.title        ?? '')
  const [presenter_id, setPresenter]    = useState(raw.presenter_id ?? '')
  const [lever_id,     setLever]        = useState(raw.lever_id     ?? '')
  const [body,         setBody]         = useState(raw.body         ?? '')
  const [links,        setLinks]        = useState<LinkItem[]>(
    (raw.links ?? []).length > 0 ? (raw.links as LinkItem[]) : [{ url: '', label: '' }],
  )
  const [image_url,    setImageUrl]     = useState(raw.image_url    ?? '')
  const [uploading,    setUploading]    = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [saveError,    setSaveError]    = useState(false)

  const persist = useCallback(async (patch: Partial<Content>) => {
    setSaving(true); setSaved(false); setSaveError(false)
    const content: Content = {
      title:        patch.title        ?? title,
      presenter_id: patch.presenter_id ?? presenter_id,
      lever_id:     patch.lever_id     ?? lever_id,
      body:         patch.body         ?? body,
      links:        patch.links        ?? links,
      image_url:    patch.image_url    ?? image_url,
    }
    const { error: err } = await getBrowserClient()
      .from('session_sections')
      .update({ content })
      .eq('id', section.id)
    if (err) { setSaving(false); setSaveError(true); setTimeout(() => setSaveError(false), 3000); return }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [title, presenter_id, lever_id, body, links, image_url, section.id])

  // Image upload
  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `deep-dive/${section.id}/${Date.now()}-${file.name}`
    const supabase = getBrowserClient()
    const { data } = await supabase.storage.from('mmu-uploads').upload(path, file, { upsert: true })
    if (data) {
      const { data: pub } = supabase.storage.from('mmu-uploads').getPublicUrl(data.path)
      setImageUrl(pub.publicUrl)
      persist({ image_url: pub.publicUrl })
    }
    setUploading(false)
  }

  // Links
  function updateLink(i: number, field: keyof LinkItem, value: string) {
    const next = links.map((l, idx) => idx === i ? { ...l, [field]: value } : l)
    setLinks(next)
    persist({ links: next })
  }
  function addLink()         { setLinks((l) => [...l, { url: '', label: '' }]) }
  function removeLink(i: number) {
    const next = links.filter((_, idx) => idx !== i)
    setLinks(next); persist({ links: next })
  }

  // Group levers
  const leverGroups = Object.entries(FOCUS_LABELS).map(([key, label]) => ({
    key, label,
    levers: levers.filter((l) => l.focus_area === key),
  })).filter((g) => g.levers.length > 0)

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 space-y-8">
      <SaveIndicator saving={saving} saved={saved} error={saveError} />

      {/* Title */}
      <div>
        <label className={fieldLabel}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); persist({ title: e.target.value }) }}
          placeholder="Deep dive topic…"
          className={inputCls}
        />
      </div>

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

      {/* Linked lever */}
      <div>
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

      {/* Body */}
      <div>
        <label className={fieldLabel}>Content</label>
        <RichTextEditor
          value={body}
          onChange={(html) => { setBody(html); persist({ body: html }) }}
          placeholder="Context, findings, analysis…"
          minHeight={200}
        />
      </div>

      {/* Image */}
      <div>
        <label className={fieldLabel}>Cover image</label>
        <div className="space-y-3">
          {image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image_url} alt="Cover" className="max-h-48 rounded-lg object-cover border border-[#DEDEDE]" />
          )}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#DEDEDE] px-4 py-3 text-[13px] text-[#969696] hover:border-[#2969FF]/50 hover:text-[#5A5A5A] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {uploading ? 'Uploading…' : 'Upload image'}
            <input type="file" accept="image/*" className="sr-only" onChange={handleImage} />
          </label>
        </div>
      </div>

      {/* Links */}
      <div>
        <label className={fieldLabel}>Links</label>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(i, 'url', e.target.value)}
                onBlur={() => persist({})}
                placeholder="https://…"
                className={inputCls}
              />
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
                onBlur={() => persist({})}
                placeholder="Label"
                className={`${inputCls} w-40`}
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="flex-shrink-0 text-[#969696] hover:text-red transition-colors"
                aria-label="Remove link"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLink}
            className="text-[12px] text-primary/60 hover:text-primary transition-colors"
          >
            + Add link
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
