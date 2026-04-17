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

  // Presentation preview styles per level
  const previewStyles: Record<1 | 2 | 3, React.CSSProperties> = {
    1: { fontSize: '32px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#ffffff' },
    2: { fontSize: '24px', fontWeight: 700, lineHeight: 1.2, color: 'rgba(255,255,255,0.85)' },
    3: { fontSize: '18px', fontWeight: 700, lineHeight: 1.3, color: 'rgba(255,255,255,0.65)' },
  }

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
        />
      </div>

      {/* Dark presentation preview */}
      {block.text && (
        <div
          className="overflow-hidden rounded-lg px-5 py-4"
          style={{ background: '#0B1527' }}
        >
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Presentation preview
          </p>
          <span style={previewStyles[block.level]}>{block.text}</span>
        </div>
      )}
    </div>
  )
}
