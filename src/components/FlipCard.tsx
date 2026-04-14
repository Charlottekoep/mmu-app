'use client'

import { useState, useRef, useEffect } from 'react'
import type { Lever } from '@/lib/types'

// ─── Progress helper ──────────────────────────────────────────────────────

function parseNumeric(s: string): number | null {
  if (!s) return null
  const lower = s.toLowerCase().trim()
  if (['tbd', 'wip', 'no', 'yes', '-%', '-'].includes(lower)) return null

  let clean = s.replace(/[$%,\s]/g, '').replace(/^[><≥≤]+/, '').trim()

  const isMillions = /^[\d.]+m$/i.test(clean)
  if (isMillions) {
    const n = parseFloat(clean)
    return isNaN(n) ? null : n * 1_000_000
  }

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
  if (ratio > 1 && rag !== 'green') return null
  return Math.min(100, Math.max(0, ratio * 100))
}

// ─── Bullet list renderer ─────────────────────────────────────────────────

function Bullets({ text }: { text: string | null | undefined }) {
  if (!text?.trim()) return null
  const lines = text.split('\n').filter((l) => l.trim())
  if (!lines.length) return null
  return (
    <ul className="m-0 list-none space-y-1.5 p-0">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2 leading-snug">
          <span className="mt-[2px] flex-shrink-0 text-white/30">•</span>
          <span>{line.trim()}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────

const RAG_COLOR: Record<string, string> = {
  green: '#1FC881',
  amber: '#FFAB00',
  red:   '#D50000',
}

// ─── Component ────────────────────────────────────────────────────────────

type Update = { done: string | null; planning: string | null }

type Props = {
  lever:    Lever
  update?:  Update
  compact?: boolean
}

export default function FlipCard({ lever, update, compact = false }: Props) {
  const [flipped, setFlipped] = useState(false)
  const backContentRef = useRef<HTMLDivElement>(null)

  const progress = calcProgress(lever.current_state, lever.target, lever.rag_status)
  const ragColor  = RAG_COLOR[lever.rag_status] ?? RAG_COLOR.amber
  const cardH     = compact ? 210 : 268

  const hasDone     = !!update?.done?.trim()
  const hasPlanning = !!update?.planning?.trim()
  const hasUpdate   = hasDone || hasPlanning

  // Auto-shrink font on back panel so content fits without overflow
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = backContentRef.current
      if (!el || el.clientHeight === 0) return
      el.style.fontSize = '16px'
      let size = 16
      while (el.scrollHeight > el.clientHeight && size > 10) {
        size -= 0.5
        el.style.fontSize = `${size}px`
      }
    })
  }, [update?.done, update?.planning])

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
          transformStyle:           'preserve-3d',
          WebkitTransformStyle:     'preserve-3d',
          transform:                flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
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
            className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full"
            style={{ background: ragColor }}
          />

          {/* Owner */}
          <p className="type-eyebrow text-primary pr-6 truncate">{lever.owner}</p>

          {/* Name */}
          <h3
            className="mt-1.5 line-clamp-2 font-bold uppercase leading-tight text-white"
            style={{
              fontSize:      compact ? '13px' : '16px',
              letterSpacing: '0.06em',
            }}
          >
            {lever.name}
          </h3>

          {/* Measure */}
          {lever.measure && (
            <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-white/45">
              {lever.measure}
            </p>
          )}

          {/* Current → Target */}
          <p className="mt-auto pt-3 text-[15px] font-bold leading-none text-white">
            {lever.current_state}
            <span className="mx-1.5 font-normal text-white/30">→</span>
            {lever.target}
          </p>

          {/* Progress bar */}
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
            {progress !== null && (
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: ragColor }}
              />
            )}
          </div>

          {/* Update indicator — small blue dot when there's content on back */}
          {hasUpdate && (
            <div className="absolute bottom-3 right-3.5 h-1.5 w-1.5 rounded-full bg-primary/60" />
          )}
        </div>

        {/* ── Back ──────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.09] shadow-elevated"
          style={{
            backfaceVisibility:       'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform:                'rotateY(180deg)',
          }}
        >
          {/* Scrollable bullet content */}
          <div
            ref={backContentRef}
            className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-white/80 [&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent"
            style={{ fontSize: '16px', lineHeight: '1.55' }}
          >
            {hasDone && <Bullets text={update!.done} />}

            {hasDone && hasPlanning && (
              <div className="my-3 border-t border-white/10" />
            )}

            {hasPlanning && <Bullets text={update!.planning} />}

            {!hasUpdate && (
              <p className="text-[12px] italic text-white/20">No update this session</p>
            )}
          </div>

          {/* Flip hint */}
          <p className="flex-shrink-0 px-3.5 pb-2 text-right text-[10px] text-white/20">
            tap to flip
          </p>
        </div>

      </div>
    </div>
  )
}
