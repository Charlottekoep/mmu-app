'use client'

import { useState } from 'react'
import type { Lever } from '@/lib/types'

// ─── Progress helper ──────────────────────────────────────────────────────

function parseNumeric(s: string): number | null {
  if (!s) return null
  const lower = s.toLowerCase().trim()
  if (['tbd', 'wip', 'no', 'yes', '-%', '-'].includes(lower)) return null

  let clean = s.replace(/[$%,\s]/g, '').replace(/^[><≥≤]+/, '').trim()

  // Handle 'm' (millions) suffix
  const isMillions = /^[\d.]+m$/i.test(clean)
  if (isMillions) {
    const n = parseFloat(clean)
    return isNaN(n) ? null : n * 1_000_000
  }

  // Strip trailing 'days', 'day'
  clean = clean.replace(/days?$/i, '').trim()

  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}

function calcProgress(
  current: string,
  target:  string,
  rag:     string,
): number | null {
  const lc = current.toLowerCase().trim()
  if (lc === 'yes') return 100
  if (lc === 'no')  return 0

  const c = parseNumeric(current)
  const t = parseNumeric(target)
  if (c === null || t === null || t === 0) return null

  const ratio = c / t
  // If current already exceeds target and the card is green, show full bar.
  // If current exceeds target but card is red/amber, it's a "lower is better"
  // metric we've missed — hide the bar to avoid showing a misleading 100%.
  if (ratio > 1 && rag !== 'green') return null

  return Math.min(100, Math.max(0, ratio * 100))
}

// ─── Constants ────────────────────────────────────────────────────────────

const RAG_COLOR: Record<string, string> = {
  green: '#1FC881',
  amber: '#FFAB00',
  red:   '#D50000',
}

const TREND_CHAR: Record<string, string> = {
  up:   '↑',
  flat: '→',
  down: '↓',
}

// ─── Component ────────────────────────────────────────────────────────────

type Props = {
  lever:    Lever
  compact?: boolean   // true → shorter card, smaller name font (for 6-col North Star row)
}

export default function FlipCard({ lever, compact = false }: Props) {
  const [flipped, setFlipped] = useState(false)

  const progress  = calcProgress(lever.current_state, lever.target, lever.rag_status)
  const ragColor  = RAG_COLOR[lever.rag_status] ?? RAG_COLOR.amber
  const cardH     = compact ? 188 : 224

  const toggle = () => setFlipped((f) => !f)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      onClick={toggle}
      onKeyDown={(e) => e.key === 'Enter' && toggle()}
      className="cursor-pointer select-none outline-none"
      style={{
        perspective:       '1200px',
        WebkitPerspective: '1200px',
        height:            `${cardH}px`,
      }}
    >
      {/* Rotating inner */}
      <div
        className="relative h-full w-full transition-transform duration-500"
        style={{
          transformStyle:       'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          transform:            flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >

        {/* ── Front ─────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 flex flex-col rounded-xl border border-white/10 bg-white/[0.06] p-5 shadow-elevated"
          style={{
            backfaceVisibility:       'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* RAG dot */}
          <div
            className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full shadow-pill"
            style={{ background: ragColor }}
          />

          {/* Owner */}
          <p className="type-eyebrow text-primary pr-6 truncate">{lever.owner}</p>

          {/* Name */}
          <h3
            className="mt-1.5 line-clamp-2 font-bold uppercase leading-tight text-white"
            style={{
              fontSize:      compact ? '15px' : '18px',
              letterSpacing: '0.08em',
            }}
          >
            {lever.name}
          </h3>

          {/* Current → Target */}
          <p className="mt-auto pt-3 text-[14px] leading-snug text-white/65">
            {lever.current_state}&nbsp;→&nbsp;{lever.target}
          </p>

          {/* Progress bar */}
          <div className="mt-2.5 h-4 flex items-center">
            {progress !== null ? (
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, background: ragColor }}
                />
              </div>
            ) : (
              <span className="text-[12px] text-white/25">—</span>
            )}
          </div>
        </div>

        {/* ── Back ──────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 flex flex-col rounded-xl border border-white/10 bg-white/[0.09] p-5 shadow-elevated"
          style={{
            backfaceVisibility:       'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform:                'rotateY(180deg)',
          }}
        >
          {/* Measure */}
          <p className="type-eyebrow text-white/65">Measure</p>
          <p className="mt-1 text-[13px] leading-snug text-white/80 line-clamp-3">
            {lever.measure}
          </p>

          {/* Stats */}
          <div className="mt-auto flex items-end gap-5 pt-3">
            <div>
              <p className="type-eyebrow text-white/65">Current</p>
              <p className="mt-0.5 text-[15px] font-bold text-white">
                {lever.current_state}
              </p>
            </div>
            <div>
              <p className="type-eyebrow text-white/65">Target</p>
              <p className="mt-0.5 text-[15px] font-bold text-white">
                {lever.target}
              </p>
            </div>
            {lever.trend && (
              <div>
                <p className="type-eyebrow text-white/65">Trend</p>
                <p className="mt-0.5 text-[20px] leading-none text-white">
                  {TREND_CHAR[lever.trend] ?? '—'}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {lever.notes && (
            <p className="mt-2.5 text-[12px] leading-snug text-white/65 line-clamp-2">
              {lever.notes}
            </p>
          )}

          {/* Flip hint */}
          <p className="absolute bottom-2.5 right-3.5 text-[10px] text-white/20">
            tap to flip
          </p>
        </div>

      </div>
    </div>
  )
}
