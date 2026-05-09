'use client'

import type { Lever } from '@/lib/types'

// ─── Progress helpers ─────────────────────────────────────────────────────

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

export function calcProgress(
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

// ─── Constants ────────────────────────────────────────────────────────────

export const RAG_COLOR: Record<string, string> = {
  green: '#1FC881',
  amber: '#FFAB00',
  red:   '#D50000',
}

// ─── Types ────────────────────────────────────────────────────────────────

export type LeverUpdate = {
  done:     string | null
  planning: string | null
  images:   string[]
}

type Props = {
  lever:              Lever
  update?:            LeverUpdate
  compact?:           boolean
  alwaysHighlighted?: boolean
  onExpand?:          () => void
}

// ─── Component ────────────────────────────────────────────────────────────

export default function FlipCard({ lever, update, compact = false, alwaysHighlighted = false, onExpand }: Props) {
  const ragColor  = RAG_COLOR[lever.rag_status] ?? RAG_COLOR.amber
  const hasSecond = !!lever.second_measure
  const cardH     = compact ? (hasSecond ? 240 : 210) : (hasSecond ? 300 : 268)

  const hasUpdate   = !!update?.done?.trim() || !!update?.planning?.trim()
  const highlighted = alwaysHighlighted || hasUpdate

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onExpand}
      onKeyDown={(e) => e.key === 'Enter' && onExpand?.()}
      className="relative flex flex-col cursor-pointer select-none outline-none rounded-xl border bg-white/[0.06] p-5"
      style={{
        height:      `${cardH}px`,
        opacity:     highlighted ? 1 : 0.55,
        borderColor: highlighted ? '#2969FF' : 'rgba(255,255,255,0.10)',
        transition:  'opacity 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* RAG dot */}
      <div
        className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full"
        style={{ background: ragColor }}
      />

      {/* 1. Owner */}
      <p className="type-eyebrow text-primary pr-6 truncate">{lever.owner}</p>

      {/* 2. Lever name */}
      <h3
        className="mt-1.5 line-clamp-2 font-bold uppercase leading-tight text-white"
        style={{ fontSize: compact ? '13px' : '17px', letterSpacing: '0.06em' }}
      >
        {lever.name}
      </h3>

      {hasSecond ? (
        /* ── Dual metric layout ── */
        <div className="mt-3 flex-1 min-h-0 flex flex-col justify-between">
          <MetricRow
            measure={lever.measure}
            current={lever.current_state}
            target={lever.target}
            ragStatus={lever.rag_status}
            ragColor={ragColor}
            compact={compact}
          />
          <div className="border-t border-white/15 my-2" />
          <MetricRow
            measure={lever.second_measure!}
            current={lever.second_current_state ?? '—'}
            target={lever.second_target ?? '—'}
            ragStatus={lever.rag_status}
            ragColor={ragColor}
            compact={compact}
          />
        </div>
      ) : (
        /* ── Single metric layout ── */
        <>
          {lever.measure && (
            <div className="mt-3">
              <p className="type-eyebrow text-white/40">Measure</p>
              <p
                className="mt-1 line-clamp-2 leading-snug text-white/65"
                style={{ fontSize: compact ? '10px' : '12px' }}
              >
                {lever.measure}
              </p>
            </div>
          )}

          <div className="flex-1" />

          <div className="flex gap-5 pt-2">
            <div>
              <p className="type-eyebrow text-white/40">Current</p>
              <p
                className="mt-1 font-bold leading-none text-white"
                style={{ fontSize: compact ? '14px' : '20px' }}
              >
                {lever.current_state}
              </p>
            </div>
            <div>
              <p className="type-eyebrow text-white/40">Target</p>
              <p
                className="mt-1 font-bold leading-none text-white/50"
                style={{ fontSize: compact ? '14px' : '20px' }}
              >
                {lever.target}
              </p>
            </div>
          </div>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
            {calcProgress(lever.current_state, lever.target, lever.rag_status) !== null && (
              <div
                className="h-full rounded-full"
                style={{
                  width:      `${calcProgress(lever.current_state, lever.target, lever.rag_status)}%`,
                  background: ragColor,
                }}
              />
            )}
          </div>
        </>
      )}

      {/* Update indicator — pulses to hint there is content inside */}
      {hasUpdate && (
        <div className="absolute bottom-3 right-3.5 animate-pulse text-[#2969FF]" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M11 6A5 5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M11 1.5V6H6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  )
}

// ─── Metric row (dual-metric variant) ────────────────────────────────────

function MetricRow({
  measure, current, target, ragStatus, ragColor, compact,
}: {
  measure:   string
  current:   string
  target:    string
  ragStatus: string
  ragColor:  string
  compact:   boolean
}) {
  const progress = calcProgress(current, target, ragStatus)
  return (
    <div>
      <p className="type-eyebrow text-white/40 truncate">{measure}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className="font-bold leading-none text-white"
          style={{ fontSize: compact ? '13px' : '15px' }}
        >
          {current}
        </span>
        <span className="text-white/25" style={{ fontSize: '10px' }}>→</span>
        <span
          className="font-bold leading-none text-white/40"
          style={{ fontSize: compact ? '13px' : '15px' }}
        >
          {target}
        </span>
      </div>
      <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-white/10">
        {progress !== null && (
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, background: ragColor }}
          />
        )}
      </div>
    </div>
  )
}
