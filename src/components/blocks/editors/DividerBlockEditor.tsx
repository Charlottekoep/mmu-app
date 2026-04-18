'use client'

import type { DividerBlock } from '@/components/blocks/BlockTypes'

const label = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'

type StyleOption = {
  value:   DividerBlock['style']
  label:   string
  preview: React.ReactNode
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    value:   'line',
    label:   'Line',
    preview: <div className="w-full h-px bg-[#DEDEDE]" />,
  },
  {
    value:   'dots',
    label:   'Dots',
    preview: (
      <div className="flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#DEDEDE]" />
        ))}
      </div>
    ),
  },
  {
    value:   'space',
    label:   'Space',
    preview: <div className="w-full h-8 rounded border border-dashed border-[#DEDEDE]" />,
  },
]

type Props = {
  block:    DividerBlock
  onChange: (block: DividerBlock) => void
}

export default function DividerBlockEditor({ block, onChange }: Props) {
  return (
    <div className="flex flex-col">
      <p className={label}>Style</p>
      <div className="grid grid-cols-3 gap-3">
        {STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ ...block, style: opt.value })}
            className={`flex flex-col items-center gap-3 rounded-xl border p-4 transition-all ${
              block.style === opt.value
                ? 'border-[#2969FF] bg-[#2969FF]/[0.06] shadow-sm'
                : 'border-[#DEDEDE] bg-white hover:border-[#2969FF]/40'
            }`}
          >
            <div className="flex w-full items-center justify-center" style={{ minHeight: 20 }}>
              {opt.preview}
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${
              block.style === opt.value ? 'text-[#2969FF]' : 'text-[#969696]'
            }`}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
