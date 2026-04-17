'use client'

import type { DeepDiveContent } from '@/components/blocks/BlockTypes'
import BlockRenderer from '@/components/blocks/BlockRenderer'

type Props = {
  content: DeepDiveContent
}

export default function DeepDiveBlockView({ content }: Props) {
  return (
    <div className="w-full">
      {/* Title */}
      {content.title && (
        <h1 className="text-[42px] font-black leading-[1.1] tracking-tight text-white">
          {content.title}
        </h1>
      )}

      {/* Presenter */}
      {content.presenter && (
        <p className="mt-2 text-[15px] font-medium text-white/50">
          {content.presenter}
        </p>
      )}

      {/* Divider below header */}
      {(content.title || content.presenter) && content.blocks.length > 0 && (
        <div className="mt-8 mb-8 border-t border-white/10" />
      )}

      {/* Blocks */}
      <div className="flex flex-col gap-10">
        {content.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </div>
  )
}
