'use client'

import type { ImageItem } from '@/lib/types'

// ─── Single aligned image ─────────────────────────────────────────────────

function AlignedImage({ item, className = '' }: { item: ImageItem; className?: string }) {
  const wrapStyle: React.CSSProperties = (() => {
    switch (item.align) {
      case 'left':   return { maxWidth: '50%', marginRight: 'auto' }
      case 'right':  return { maxWidth: '50%', marginLeft:  'auto' }
      case 'full':   return { width: '100%' }
      default:       return { maxWidth: '70%', margin: '0 auto' }   // center
    }
  })()

  return (
    <div style={wrapStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.url}
        alt=""
        className={`w-full h-auto rounded-xl border border-white/10 ${className}`}
      />
    </div>
  )
}

// ─── List of aligned images ───────────────────────────────────────────────

type Props = {
  images:    ImageItem[]
  className?: string
}

export default function AlignedImages({ images, className = '' }: Props) {
  if (!images.length) return null
  return (
    <div className={`space-y-4 ${className}`}>
      {images.map((item, i) => (
        <AlignedImage key={i} item={item} />
      ))}
    </div>
  )
}
