'use client'

import { useState } from 'react'
import { getTeamPhotoUrl } from '@/lib/teamPhoto'
import type { TeamMember } from '@/lib/types'

// ─── Props ────────────────────────────────────────────────────────────────

type Props = {
  member:     TeamMember | undefined
  size:       number
  /** Extra classes applied to both the img and the placeholder (e.g. border styles) */
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────

export default function TeamAvatar({ member, size, className = '' }: Props) {
  const [imgError, setImgError] = useState(false)
  const s = `${size}px`
  const base = `flex-shrink-0 rounded-full ${className}`

  if (!member || imgError) {
    return (
      <div
        className={base}
        style={{ width: s, height: s, minWidth: s, backgroundColor: '#0F1B4A' }}
        aria-hidden="true"
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getTeamPhotoUrl(member.name)}
      alt={member.name}
      onError={() => setImgError(true)}
      className={`object-cover ${base}`}
      style={{ width: s, height: s }}
    />
  )
}
