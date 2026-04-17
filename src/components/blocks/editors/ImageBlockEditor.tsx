'use client'

import { useRef, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { ImageBlock } from '@/components/blocks/BlockTypes'

const label   = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'

type Props = {
  block:    ImageBlock
  onChange: (block: ImageBlock) => void
  folder:   string
}

type SizeOption = { value: ImageBlock['size']; label: string }

const SIZE_OPTIONS: SizeOption[] = [
  { value: 'small',  label: 'Small'      },
  { value: 'medium', label: 'Medium'     },
  { value: 'large',  label: 'Large'      },
  { value: 'full',   label: 'Full width' },
]

export default function ImageBlockEditor({ block, onChange, folder }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${folder}/${Date.now()}-${file.name}`
    const supabase = getBrowserClient()
    const { data } = await supabase.storage
      .from('session-images')
      .upload(path, file, { upsert: true })
    if (data) {
      const { data: pub } = supabase.storage.from('session-images').getPublicUrl(data.path)
      onChange({ ...block, url: pub.publicUrl })
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Image URL / upload */}
      <div>
        <label className={label}>Image</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder="https://… or upload below"
            className={inputCls}
          />
          <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[13px] text-[#969696] transition-colors hover:border-[#2969FF]/50 hover:text-[#2969FF]">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {uploading ? 'Uploading…' : 'Upload'}
            <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Preview */}
      {block.url && (
        <div className="relative overflow-hidden rounded-lg border border-[#DEDEDE] bg-[#F7F7F7]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt} className="w-full h-auto max-h-48 object-contain" />
          <button
            type="button"
            onClick={() => onChange({ ...block, url: '' })}
            aria-label="Remove image"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Alt text */}
      <div>
        <label className={label}>Alt text</label>
        <input
          type="text"
          value={block.alt}
          onChange={(e) => onChange({ ...block, alt: e.target.value })}
          placeholder="Describe the image for accessibility…"
          className={inputCls}
        />
      </div>

      {/* Caption */}
      <div>
        <label className={label}>Caption (optional)</label>
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          placeholder="Image caption…"
          className={inputCls}
        />
      </div>

      {/* Size */}
      <div>
        <p className={label}>Size</p>
        <div className="flex gap-2">
          {SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...block, size: opt.value })}
              className={`flex-1 rounded-lg border py-2 text-[12px] font-medium transition-colors ${
                block.size === opt.value
                  ? 'border-[#2969FF] bg-[#2969FF]/10 text-[#2969FF]'
                  : 'border-[#DEDEDE] bg-white text-[#969696] hover:border-[#2969FF]/50 hover:text-[#2969FF]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
