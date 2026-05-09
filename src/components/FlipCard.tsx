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
  if (c === null || t === null) return null

  // Special case: target is zero (e.g. "1 overdue → 0")
  // Use inverse proportion so the bar isn't empty while work remains
  if (t === 0) {
    if (rag === 'green' || c === 0) return 100
    return Math.round((1 / (1 + c)) * 100)
  }

  // Presenter has confirmed the metric is met — fill bar completely
  if (rag === 'green') return 100

  // Burn-down: current is above target (lower is better, e.g. 139 days → 100 days)
  // Fill = how close current is to target from above: target / current
  if (c > t) return Math.min(100, (t / c) * 100)

  // Burn-up: current is at or below target (higher is better, e.g. 42% → 75%)
  // Fill = current / target; reaches 100 exactly when c === t
  return Math.min(100, (c / t) * 100)
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
  const ragColor       = RAG_COLOR[lever.rag_status]              ?? RAG_COLOR.amber
  const secondRagColor = RAG_COLOR[lever.second_rag_status ?? ''] ?? RAG_COLOR.amber
  const hasSecond = !!lever.second_measure
  const cardH     = compact ? 210 : 268

  // Worst RAG across both metrics (red > amber > green) — only for dual-metric cards
  const dotColor = (() => {
    if (!hasSecond || !lever.second_rag_status) return ragColor
    if (lever.rag_status === 'red'   || lever.second_rag_status === 'red')   return RAG_COLOR.red
    if (lever.rag_status === 'amber' || lever.second_rag_status === 'amber') return RAG_COLOR.amber
    return RAG_COLOR.green
  })()

  const hasUpdate      = !!update?.done?.trim() || !!update?.planning?.trim()
  const highlighted    = alwaysHighlighted || hasUpdate
  // Computed once here to avoid the double-call in the single-metric branch
  const singleProgress  = hasSecond
    ? null
    : calcProgress(lever.current_state, lever.target, lever.rag_status)
  const primaryProgress = hasSecond
    ? calcProgress(lever.current_state, lever.target, lever.rag_status)
    : null

  // Secondary bar: uses second_rag_status for the green-override check.
  // Only renders when both second_current_state and second_target are present.
  const secondProgress: number | null = (() => {
    if (!hasSecond) return null
    const rawC = lever.second_current_state
    const rawT = lever.second_target
    if (!rawC || !rawT) return null
    const c = parseNumeric(rawC)
    const t = parseNumeric(rawT)
    if (c === null || t === null) return null
    const secondRag = lever.second_rag_status ?? lever.rag_status
    if (secondRag === 'green' || c === 0) return 100
    if (t === 0) return Math.round((1 / (1 + c)) * 100)
    if (c > t)   return Math.min(100, Math.round((t / c) * 100))
    return Math.min(100, Math.round((c / t) * 100))
  })()

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
      {/* RAG dot — worst RAG for dual-metric, own RAG for single */}
      <div
        className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full"
        style={{ background: dotColor }}
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
        /* ── Dual-metric layout: identical to single-metric, adds a second bar ── */
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

          {/* Primary bar */}
          <div
            className="mt-3 overflow-hidden rounded-full bg-white/10"
            style={{ height: compact ? '5px' : '6px' }}
          >
            {primaryProgress !== null && (
              <div
                className="h-full rounded-full"
                style={{
                  width:      `${primaryProgress}%`,
                  background: primaryProgress === 100 ? '#1FC881' : ragColor,
                }}
              />
            )}
          </div>

          {/* Secondary bar */}
          <div
            className="mt-2 overflow-hidden rounded-full bg-white/10"
            style={{ height: compact ? '5px' : '6px' }}
          >
            {secondProgress !== null && (
              <div
                className="h-full rounded-full"
                style={{
                  width:      `${secondProgress}%`,
                  background: secondProgress === 100 ? '#1FC881' : secondRagColor,
                }}
              />
            )}
          </div>

          {/* Second metric inline values */}
          {lever.second_current_state && lever.second_target && (
            <p
              className="mt-1.5 truncate leading-none"
              style={{ fontSize: compact ? '9px' : '11px', color: 'rgba(255,255,255,0.65)' }}
            >
              {lever.second_current_state} → {lever.second_target}
            </p>
          )}
        </>
      ) : (
        /* ── Single-metric layout (unchanged) ── */
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
            {singleProgress !== null && (
              <div
                className="h-full rounded-full"
                style={{
                  width:      `${singleProgress}%`,
                  background: singleProgress === 100 ? '#1FC881' : ragColor,
                }}
              />
            )}
          </div>
        </>
      )}

      {/* Update indicator */}
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

