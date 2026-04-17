'use client'

import type { HeadingBlock } from '@/components/blocks/BlockTypes'

const label = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'

type Props = {
  block:    HeadingBlock
  onChange: (block: HeadingBlock) => void
}

export default function HeadingBlockEditor({ block, onChange }: Props) {
  const levels: { value: 1 | 2 | 3; label: string }[] = [
    { value: 1, label: 'H1' },
    { value: 2, label: 'H2' },
    { value: 3, label: 'H3' },
  ]

  return (
    <div className="space-y-4">
      {/* Level selector */}
      <div>
        <p className={label}>Level</p>
        <div className="flex gap-2">
          {levels.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => onChange({ ...block, level: l.value })}
              className={`h-9 w-14 rounded-lg border text-[13px] font-bold transition-colors ${
                block.level === l.value
                  ? 'border-[#2969FF] bg-[#2969FF]/10 text-[#2969FF]'
                  : 'border-[#DEDEDE] bg-white text-[#969696] hover:border-[#2969FF]/50 hover:text-[#2969FF]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text */}
      <div>
        <label className={label}>Text</label>
        <input
          type="text"
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder={`Heading ${block.level} text…`}
          className={inputCls}
          style={{
            fontSize: block.level === 1 ? '22px' : block.level === 2 ? '18px' : '15px',
            fontWeight: 700,
          }}
        />
      </div>
    </div>
  )
}
