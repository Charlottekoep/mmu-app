'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getBrowserClient } from '@/lib/supabase'
import type { Lever, SessionSection } from '@/lib/types'
import { normaliseImages } from '@/lib/types'
import DarkPageLayout from '@/components/DarkPageLayout'
import AlignedImages  from '@/components/AlignedImages'
import FlipCard, { calcProgress, RAG_COLOR, type LeverUpdate } from '@/components/FlipCard'

// ─── Focus area config ────────────────────────────────────────────────────

const GROUPS: { key: string; label: string }[] = [
  { key: 'north_star',            label: 'North Star' },
  { key: 'grow_client_base',      label: 'Grow Our Client Base' },
  { key: 'increase_client_value', label: 'Increase Client Value' },
  { key: 'returns_to_scale',      label: 'Returns to Scale' },
  { key: 'enablers',              label: 'Enablers' },
]

// ─── Types ────────────────────────────────────────────────────────────────

type Props = { section: SessionSection; sessionId: string }

// ─── Component ────────────────────────────────────────────────────────────

export default function NorthStarSection({ section, sessionId }: Props) {
  const [levers,   setLevers]   = useState<Lever[]>([])
  const [updates,  setUpdates]  = useState<Map<string, LeverUpdate>>(new Map())
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)
  const [expanded, setExpanded] = useState<{ lever: Lever; update: LeverUpdate } | null>(null)
  const [mounted,  setMounted]  = useState(false)

  const sectionImages = normaliseImages(
    Array.isArray((section.content as { images?: unknown[] })?.images)
      ? (section.content as { images: unknown[] }).images as (string | { url: string; align: 'left' | 'center' | 'right' | 'full' })[]
      : [],
  )

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(false)

      const supabase = getBrowserClient()

      const [leverRes, snapRes] = await Promise.all([
        supabase.from('levers').select('*').order('display_order'),
        supabase.from('lever_snapshots').select('*').eq('session_id', sessionId),
      ])

      if (cancelled) return
      if (leverRes.error) { setError(true); setLoading(false); return }

      const snapshotMap = new Map((snapRes.data ?? []).map((s) => [s.lever_id, s]))

      setLevers(
        (leverRes.data ?? []).map((lever) => {
          const snap = snapshotMap.get(lever.id)
          if (!snap) return lever
          return {
            ...lever,
            current_state: snap.current_state,
            rag_status:    snap.rag_status,
            trend:         snap.trend,
            notes:         snap.notes,
          }
        }),
      )

      setUpdates(
        new Map(
          (snapRes.data ?? []).map((s) => [
            s.lever_id,
            {
              done:     s.done_update     ?? null,
              planning: s.planning_update ?? null,
              images:   s.images          ?? [],
            },
          ]),
        ),
      )

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [sessionId])

  if (loading || error) {
    return (
      <DarkPageLayout>
        <div className="flex h-screen items-center justify-center">
          {error ? (
            <p className="type-eyebrow text-red">Failed to load levers</p>
          ) : (
            <p className="type-eyebrow text-white/30">Loading levers…</p>
          )}
        </div>
      </DarkPageLayout>
    )
  }

  const groups = GROUPS.map(({ key, label }) => ({
    key,
    label,
    levers: levers.filter((l) => l.focus_area === key),
  })).filter((g) => g.levers.length > 0)

  return (
    <DarkPageLayout>
      <div className="h-screen overflow-y-auto px-14 pt-24 pb-20">

        {/* ── Heading ──────────────────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="type-h2 text-white">North Star &amp; Momentum</h1>
          <p className="mt-3 type-body-large text-white/65">
            Grow Root into a profitable, efficient $18m ARR business by 2029
          </p>
        </div>

        {/* ── Focus area groups ─────────────────────────────────────── */}
        <div className="space-y-12">
          {groups.map(({ key, label, levers }) => (
            <section key={key}>
              <p className="type-eyebrow text-white mb-4">{label}</p>
              <div
                className={
                  key === 'north_star'
                    ? 'grid grid-cols-3 gap-3 xl:grid-cols-6'
                    : 'grid grid-cols-2 gap-4 xl:grid-cols-3'
                }
              >
                {levers.map((lever) => {
                  const update = updates.get(lever.id) ?? { done: null, planning: null, images: [] }
                  return (
                    <FlipCard
                      key={lever.id}
                      lever={lever}
                      update={update}
                      compact={key === 'north_star'}
                      alwaysHighlighted={key === 'north_star'}
                      onExpand={() => setExpanded({ lever, update })}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        {/* ── Section images ────────────────────────────────────────── */}
        {sectionImages.length > 0 && (
          <AlignedImages images={sectionImages} className="mt-12" />
        )}

      </div>

      {/* ── Full-screen expanded modal (portal escapes overflow-hidden) ── */}
      {mounted && expanded && createPortal(
        <ExpandedModal
          lever={expanded.lever}
          update={expanded.update}
          onClose={() => setExpanded(null)}
        />,
        document.body,
      )}
    </DarkPageLayout>
  )
}

// ─── Full-screen expanded modal ───────────────────────────────────────────

function ExpandedModal({
  lever,
  update,
  onClose,
}: {
  lever:   Lever
  update:  LeverUpdate
  onClose: () => void
}) {
  const [visible, setVisible] = useState(false)

  const ragColor    = RAG_COLOR[lever.rag_status] ?? RAG_COLOR.amber
  const progress    = calcProgress(lever.current_state, lever.target, lever.rag_status)
  const hasDone     = !!update.done?.trim()
  const hasPlanning = !!update.planning?.trim()
  const hasImages   = update.images.length > 0

  // Fade in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function close() {
    setVisible(false)
    setTimeout(onClose, 260)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: '#0F1B4A',
        border:     '2px solid #2969FF',
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'scale(1)' : 'scale(1.015)',
        transition: 'opacity 0.28s ease, transform 0.28s ease',
      }}
    >
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-16 pt-14 pb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <p className="type-eyebrow text-primary">{lever.owner}</p>
          <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: ragColor }} />
        </div>
        <h1
          className="font-black uppercase leading-none text-white"
          style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', letterSpacing: '0.04em' }}
        >
          {lever.name}
        </h1>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div
        className={`flex-1 min-h-0 px-16 pb-8 grid grid-rows-1 gap-10 ${
          hasImages ? 'grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* Left: update text — scrolls independently if long */}
        <div className="overflow-y-auto min-h-0 space-y-7 py-2">
          {hasDone && (
            <div>
              <p className="type-eyebrow text-white/45 mb-3">What we&apos;ve done</p>
              <BulletList text={update.done} />
            </div>
          )}
          {hasDone && hasPlanning && (
            <div className="border-t border-white/10" />
          )}
          {hasPlanning && (
            <div>
              <p className="type-eyebrow text-white/45 mb-3">What we&apos;re planning</p>
              <BulletList text={update.planning} />
            </div>
          )}
          {!hasDone && !hasPlanning && (
            <p className="text-[17px] italic text-white/30">No update for this session.</p>
          )}
        </div>

        {/* Right: image grid — fills full column height */}
        {hasImages && (
          <ImageGrid images={update.images} />
        )}
      </div>

      {/* ── Bottom strip: measure / current / target / progress ──── */}
      <div className="flex-shrink-0 border-t border-white/10 px-16 py-5">
        <div className="flex items-start gap-10">
          {lever.measure && (
            <div className="flex-1 min-w-0">
              <p className="type-eyebrow text-white/35 mb-1">Measure</p>
              <p className="text-[13px] text-white/55 leading-snug line-clamp-2">{lever.measure}</p>
            </div>
          )}
          <div className="flex-shrink-0">
            <p className="type-eyebrow text-white/35 mb-1">Current</p>
            <p className="text-[18px] font-bold text-white leading-none">{lever.current_state}</p>
          </div>
          <div className="flex-shrink-0">
            <p className="type-eyebrow text-white/35 mb-1">Target</p>
            <p className="text-[18px] font-bold text-white/50 leading-none">{lever.target}</p>
          </div>
          <div className="flex-shrink-0 w-40">
            <p className="type-eyebrow text-white/35 mb-2">Progress</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              {progress !== null && (
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, background: ragColor }}
                />
              )}
            </div>
            {progress !== null && (
              <p className="mt-1 text-[11px] text-white/30">{Math.round(progress)}%</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Close button — last in DOM so it always paints on top ─── */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); close() }}
        aria-label="Close"
        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white/60 transition-all hover:border-white/60 hover:bg-white/15 hover:text-white"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

// ─── Bullet list ──────────────────────────────────────────────────────────

function BulletList({ text }: { text: string | null | undefined }) {
  if (!text?.trim()) return null
  const lines = text.split('\n').filter((l) => l.trim())
  return (
    <ul className="m-0 list-none space-y-3 p-0">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-3 leading-snug text-white/80" style={{ fontSize: '19px' }}>
          <span className="mt-[3px] flex-shrink-0 text-white/25">•</span>
          <span>{line.trim()}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Image grid ───────────────────────────────────────────────────────────
// Fills the full height of its grid cell. The parent grid uses grid-rows-1
// so both columns stretch to the available modal height.

const IMG = 'w-full h-full object-contain rounded-xl border border-white/10'

function ImageGrid({ images }: { images: string[] }) {
  // 1 image — fills entire column
  if (images.length === 1) {
    return (
      <div className="h-full py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt="" className={IMG} />
      </div>
    )
  }

  // 2 images — equal vertical stack
  if (images.length === 2) {
    return (
      <div className="h-full py-2 grid grid-rows-2 gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt="" className={IMG} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[1]} alt="" className={IMG} />
      </div>
    )
  }

  // 3 images — top half: image[0] full width; bottom half: image[1] + image[2] side-by-side
  return (
    <div className="h-full py-2 grid grid-rows-2 gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[0]} alt="" className={IMG} />
      <div className="grid grid-cols-2 gap-3 min-h-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[1]} alt="" className={IMG} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[2]} alt="" className={IMG} />
      </div>
    </div>
  )
}
