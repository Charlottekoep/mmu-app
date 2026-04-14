'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getBrowserClient } from '@/lib/supabase'
import type { Lever, SessionSection } from '@/lib/types'
import DarkPageLayout from '@/components/DarkPageLayout'
import FlipCard from '@/components/FlipCard'

// ─── Focus area config ────────────────────────────────────────────────────

const GROUPS: { key: string; label: string }[] = [
  { key: 'north_star',            label: 'North Star' },
  { key: 'grow_client_base',      label: 'Grow Our Client Base' },
  { key: 'increase_client_value', label: 'Increase Client Value' },
  { key: 'returns_to_scale',      label: 'Returns to Scale' },
  { key: 'enablers',              label: 'Enablers' },
]

const RAG_COLOR: Record<string, string> = {
  green: '#1FC881',
  amber: '#FFAB00',
  red:   '#D50000',
}

// ─── Types ────────────────────────────────────────────────────────────────

type LeverUpdate = {
  done:     string | null
  planning: string | null
  images:   string[]
}

type Props = { section: SessionSection; sessionId: string }

// ─── Component ────────────────────────────────────────────────────────────

export default function NorthStarSection({ section, sessionId }: Props) {
  const [levers,   setLevers]   = useState<Lever[]>([])
  const [updates,  setUpdates]  = useState<Map<string, LeverUpdate>>(new Map())
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)
  const [expanded, setExpanded] = useState<{ lever: Lever; update: LeverUpdate } | null>(null)
  const [mounted,  setMounted]  = useState(false)

  const sectionImages = Array.isArray((section.content as { images?: string[] })?.images)
    ? (section.content as { images: string[] }).images
    : []

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

      const snapshotMap = new Map(
        (snapRes.data ?? []).map((s) => [s.lever_id, s]),
      )

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
          <div className={`mt-12 grid gap-3 ${sectionImages.length === 1 ? 'grid-cols-1 max-w-2xl' : sectionImages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {sectionImages.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="w-full h-auto rounded-xl border border-white/10" />
            ))}
          </div>
        )}

      </div>

      {/* ── Expanded card modal (portal) ──────────────────────────── */}
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

// ─── Expanded modal ───────────────────────────────────────────────────────

function ExpandedModal({
  lever,
  update,
  onClose,
}: {
  lever:   Lever
  update:  LeverUpdate
  onClose: () => void
}) {
  const [visible,  setVisible]  = useState(false)
  const [imgIdx,   setImgIdx]   = useState(0)

  const ragColor    = RAG_COLOR[lever.rag_status] ?? RAG_COLOR.amber
  const images      = update.images
  const hasDone     = !!update.done?.trim()
  const hasPlanning = !!update.planning?.trim()

  // Fade/scale in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft'  && images.length > 1) setImgIdx((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight' && images.length > 1) setImgIdx((i) => Math.min(images.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length])

  function close() {
    setVisible(false)
    setTimeout(onClose, 260)
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:     'rgba(8, 14, 41, 0.85)',
          backdropFilter: 'blur(6px)',
          opacity:         visible ? 1 : 0,
          transition:     'opacity 0.25s ease',
        }}
        onClick={close}
      />

      {/* Centering layer — pointer-events-none so backdrop clicks work */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
        <div
          className="pointer-events-auto relative flex w-full max-w-3xl flex-col rounded-2xl shadow-2xl"
          style={{
            background: '#0F1B4A',
            border:     '1.5px solid #2969FF',
            maxHeight:  'calc(100vh - 80px)',
            opacity:    visible ? 1 : 0,
            transform:  visible ? 'scale(1)' : 'scale(0.96)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/40 transition-all hover:bg-white/10 hover:text-white"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Scrollable content */}
          <div className="overflow-y-auto p-8 pr-14">

            {/* Header: name + owner + RAG */}
            <h2
              className="font-bold uppercase leading-tight text-white"
              style={{ fontSize: '26px', letterSpacing: '0.06em' }}
            >
              {lever.name}
            </h2>
            <div className="mt-2.5 flex items-center gap-2.5">
              <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: ragColor }} />
              <span className="type-eyebrow text-white/45">{lever.owner}</span>
            </div>

            {/* Body: two-column if images, full-width if not */}
            <div className={`mt-8 grid gap-10 ${images.length > 0 ? 'grid-cols-[1fr_300px]' : 'grid-cols-1'}`}>

              {/* Left: update text as bullets */}
              <div className="space-y-6">
                {hasDone && (
                  <div>
                    <p className="type-eyebrow text-white/40 mb-3">What we&apos;ve done</p>
                    <ModalBullets text={update.done} />
                  </div>
                )}
                {hasDone && hasPlanning && (
                  <div className="border-t border-white/10" />
                )}
                {hasPlanning && (
                  <div>
                    <p className="type-eyebrow text-white/40 mb-3">What we&apos;re planning</p>
                    <ModalBullets text={update.planning} />
                  </div>
                )}
                {!hasDone && !hasPlanning && (
                  <p className="text-[16px] italic text-white/30">No update for this session.</p>
                )}
              </div>

              {/* Right: image carousel */}
              {images.length > 0 && (
                <div className="flex flex-col items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[imgIdx]}
                    alt=""
                    className="w-full h-auto rounded-xl border border-white/10"
                    style={{ maxHeight: '340px', objectFit: 'contain' }}
                  />
                  {images.length > 1 && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                        disabled={imgIdx === 0}
                        className="rounded-full border border-white/20 px-3 py-1.5 text-[12px] text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-25"
                      >
                        ← Prev
                      </button>
                      <span className="type-eyebrow text-white/30">{imgIdx + 1} / {images.length}</span>
                      <button
                        type="button"
                        onClick={() => setImgIdx((i) => Math.min(images.length - 1, i + 1))}
                        disabled={imgIdx === images.length - 1}
                        className="rounded-full border border-white/20 px-3 py-1.5 text-[12px] text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-25"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal bullet list ────────────────────────────────────────────────────

function ModalBullets({ text }: { text: string | null | undefined }) {
  if (!text?.trim()) return null
  const lines = text.split('\n').filter((l) => l.trim())
  return (
    <ul className="m-0 list-none space-y-3 p-0">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-3 text-[19px] leading-snug text-white/80">
          <span className="mt-[3px] flex-shrink-0 text-white/25">•</span>
          <span>{line.trim()}</span>
        </li>
      ))}
    </ul>
  )
}
