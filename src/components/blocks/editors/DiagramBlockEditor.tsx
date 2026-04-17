'use client'

import DiagramBuilder from '@/components/DiagramBuilder'
import type { DiagramBlock } from '@/components/blocks/BlockTypes'

const inputCls = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2 text-[13px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'

type Props = {
  block:    DiagramBlock
  onChange: (block: DiagramBlock) => void
}

export default function DiagramBlockEditor({ block, onChange }: Props) {
  return (
    <div className="space-y-3">
      <DiagramBuilder
        shapes={block.shapes}
        arrows={block.arrows}
        onChange={(shapes, arrows) => onChange({ ...block, shapes, arrows })}
      />
      <input
        type="text"
        value={block.caption}
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        placeholder="Caption (optional)…"
        className={inputCls}
      />
    </div>
  )
}
