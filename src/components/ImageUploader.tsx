'use client'

import { useRef, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { ImageAlign, ImageItem } from '@/lib/types'

// ─── Alignment button icons ────────────────────────────────────────────────

function AlignLeftIcon()   {
  return (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor" aria-hidden>
      <rect x="0" y="0"   width="13" height="2" rx="1"/>
      <rect x="0" y="4.5" width="9"  height="2" rx="1"/>
      <rect x="0" y="9"   width="11" height="2" rx="1"/>
    </svg>
  )
}
function AlignCenterIcon() {
  return (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor" aria-hidden>
      <rect x="0"   y="0"   width="13" height="2" rx="1"/>
      <rect x="2"   y="4.5" width="9"  height="2" rx="1"/>
      <rect x="1"   y="9"   width="11" height="2" rx="1"/>
    </svg>
  )
}
function AlignRightIcon()  {
  return (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor" aria-hidden>
      <rect x="0" y="0"   width="13" height="2" rx="1"/>
      <rect x="4" y="4.5" width="9"  height="2" rx="1"/>
      <rect x="2" y="9"   width="11" height="2" rx="1"/>
    </svg>
  )
}
function AlignFullIcon()   {
  return (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor" aria-hidden>
      <rect x="0" y="0"   width="13" height="2" rx="1"/>
      <rect x="0" y="4.5" width="13" height="2" rx="1"/>
      <rect x="0" y="9"   width="13" height="2" rx="1"/>
    </svg>
  )
}

const ALIGN_OPTIONS: { value: ImageAlign; label: string; icon: React.ReactNode }[] = [
  { value: 'left',   label: 'Left',        icon: <AlignLeftIcon />   },
  { value: 'center', label: 'Centre',      icon: <AlignCenterIcon /> },
  { value: 'right',  label: 'Right',       icon: <AlignRightIcon />  },
  { value: 'full',   label: 'Full width',  icon: <AlignFullIcon />   },
]

// ─── Props ─────────────────────────────────────────────────────────────────

type Props = {
  images:   ImageItem[]
  onChange: (images: ImageItem[]) => void
  /** Storage path prefix, e.g. `${sessionId}/${sectionId}` */
  folder:   string
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function ImageUploader({ images, onChange, folder }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const scrollEl      = findScrollParent(e.currentTarget)
    const savedScrollTop = scrollEl?.scrollTop ?? 0

    setUploading(true)
    const supabase = getBrowserClient()
    const next: ImageItem[] = [...images]

    for (const file of files) {
      const path = `${folder}/${Date.now()}-${file.name}`
      const { data } = await supabase.storage
        .from('session-images')
        .upload(path, file, { upsert: true })
      if (data) {
        const { data: pub } = supabase.storage
          .from('session-images')
          .getPublicUrl(data.path)
        next.push({ url: pub.publicUrl, align: 'center' })
      }
    }

    onChange(next)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    if (scrollEl) requestAnimationFrame(() => { scrollEl.scrollTop = savedScrollTop })
  }

  async function remove(item: ImageItem) {
    const storagePath = item.url.split('/session-images/')[1]
    if (storagePath) {
      await getBrowserClient().storage.from('session-images').remove([storagePath])
    }
    onChange(images.filter((i) => i !== item))
  }

  function setAlign(item: ImageItem, align: ImageAlign) {
    onChange(images.map((i) => i === item ? { ...i, align } : i))
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className={`grid gap-3 ${
          images.length === 1 ? 'grid-cols-1' :
          images.length === 2 ? 'grid-cols-2' :
          'grid-cols-3 sm:grid-cols-4'
        }`}>
          {images.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1.5">
              {/* Thumbnail */}
              <div className="group relative aspect-video overflow-hidden rounded-lg border border-[#DEDEDE] bg-[#F7F7F7]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label="Remove image"
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                    <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Alignment buttons */}
              <div className="flex items-center rounded-lg border border-[#DEDEDE] bg-white overflow-hidden divide-x divide-[#DEDEDE]">
                {ALIGN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.label}
                    onClick={() => setAlign(item, opt.value)}
                    className={`flex flex-1 items-center justify-center py-1.5 transition-colors ${
                      item.align === opt.value
                        ? 'bg-[#2969FF] text-white'
                        : 'text-[#969696] hover:bg-[#F7F7F7] hover:text-[#262626]'
                    }`}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#DEDEDE] px-4 py-3 text-[13px] text-[#969696] hover:border-[#2969FF]/50 hover:text-[#5A5A5A] transition-colors">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {uploading ? 'Uploading…' : 'Add images'}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFiles}
          disabled={uploading}
        />
      </label>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null
  let parent = el.parentElement
  while (parent && parent !== document.documentElement) {
    const { overflow, overflowY } = getComputedStyle(parent)
    if (/(auto|scroll)/.test(overflow + overflowY)) return parent
    parent = parent.parentElement
  }
  return null
}
