'use client'

import { useRef, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'

// ─── Props ────────────────────────────────────────────────────────────────

type Props = {
  images:   string[]
  onChange: (images: string[]) => void
  /** Storage path prefix, e.g. `${sessionId}/${sectionId}` */
  folder:   string
}

// ─── Component ────────────────────────────────────────────────────────────

export default function ImageUploader({ images, onChange, folder }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    // Save scroll position of nearest scrollable ancestor before any state change
    const scrollEl = findScrollParent(e.currentTarget)
    const savedScrollTop = scrollEl?.scrollTop ?? 0

    setUploading(true)
    const supabase = getBrowserClient()
    const urls: string[] = [...images]
    for (const file of files) {
      const path = `${folder}/${Date.now()}-${file.name}`
      const { data } = await supabase.storage
        .from('session-images')
        .upload(path, file, { upsert: true })
      if (data) {
        const { data: pub } = supabase.storage
          .from('session-images')
          .getPublicUrl(data.path)
        urls.push(pub.publicUrl)
      }
    }
    onChange(urls)
    setUploading(false)

    // Reset input via ref — avoids focus-induced scroll from resetting e.target directly
    if (inputRef.current) inputRef.current.value = ''

    // Restore scroll after React has re-rendered with new images
    if (scrollEl) {
      requestAnimationFrame(() => { scrollEl.scrollTop = savedScrollTop })
    }
  }

  async function remove(url: string) {
    // Best-effort delete from storage — extract path after bucket name
    const storagePath = url.split('/session-images/')[1]
    if (storagePath) {
      await getBrowserClient().storage.from('session-images').remove([storagePath])
    }
    onChange(images.filter((u) => u !== url))
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        // aspect-video gives each thumbnail a stable 16:9 box — prevents layout shift on upload
        <div className={`grid gap-2 ${
          images.length === 1 ? 'grid-cols-1' :
          images.length === 2 ? 'grid-cols-2' :
          'grid-cols-3 sm:grid-cols-4'
        }`}>
          {images.map((url) => (
            <div
              key={url}
              className="group relative aspect-video overflow-hidden rounded-lg border border-[#DEDEDE] bg-[#F7F7F7]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                aria-label="Remove image"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                  <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>
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

// Walk up the DOM to find the nearest element with overflow scroll/auto
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
