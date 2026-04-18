'use client'

import type { LinkCardBlock } from '@/components/blocks/BlockTypes'

const label    = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'

type Props = {
  block:    LinkCardBlock
  onChange: (block: LinkCardBlock) => void
}

export default function LinkCardBlockEditor({ block, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <label className={label}>URL</label>
        <input
          type="url"
          value={block.url}
          onChange={(e) => onChange({ ...block, url: e.target.value })}
          placeholder="https://…"
          className={inputCls}
        />
      </div>

      <div className="flex flex-col">
        <label className={label}>Title</label>
        <input
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Card title…"
          className={inputCls}
        />
      </div>

      <div className="flex flex-col">
        <label className={label}>Description</label>
        <input
          type="text"
          value={block.description}
          onChange={(e) => onChange({ ...block, description: e.target.value })}
          placeholder="Short description…"
          className={inputCls}
        />
      </div>

      {/* Live preview */}
      {(block.title || block.url) && (
        <div className="flex flex-col">
          <p className={label}>Preview</p>
          <div className="flex items-start gap-3 rounded-xl border border-[#DEDEDE] bg-white p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#2969FF]/10 text-[#2969FF]">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path d="M2 13L13 2M13 2H7.5M13 2v5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#262626] truncate">{block.title || block.url}</p>
              {block.description && (
                <p className="mt-0.5 text-[12px] text-[#969696] line-clamp-2">{block.description}</p>
              )}
              {block.url && (
                <p className="mt-1 text-[11px] text-[#2969FF]/70 truncate">{block.url}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
