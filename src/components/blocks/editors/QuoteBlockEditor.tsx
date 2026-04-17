'use client'

import type { QuoteBlock } from '@/components/blocks/BlockTypes'

const label      = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls   = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'
const textareaCls = `${inputCls} resize-none`

type Props = {
  block:    QuoteBlock
  onChange: (block: QuoteBlock) => void
}

export default function QuoteBlockEditor({ block, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className={label}>Quote text</label>
        <textarea
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          rows={4}
          placeholder="Enter the quote…"
          className={textareaCls}
          style={{ fontSize: '18px', fontStyle: 'italic', lineHeight: 1.5 }}
        />
      </div>

      <div>
        <label className={label}>Attribution (optional)</label>
        <input
          type="text"
          value={block.attribution}
          onChange={(e) => onChange({ ...block, attribution: e.target.value })}
          placeholder="— Name, Title"
          className={inputCls}
        />
      </div>

      {/* Live preview */}
      {block.text && (
        <div>
          <p className={label}>Preview</p>
          <div className="rounded-xl border-l-4 border-[#2969FF] bg-[#F7F7F7] py-4 pl-5 pr-4">
            <p className="text-[17px] italic leading-relaxed text-[#262626]">&ldquo;{block.text}&rdquo;</p>
            {block.attribution && (
              <p className="mt-3 text-[12px] font-medium text-[#969696]">{block.attribution}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
