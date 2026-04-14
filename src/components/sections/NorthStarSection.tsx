'use client'

import { useEffect, useState } from 'react'
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

// ─── Component ────────────────────────────────────────────────────────────

type Props = { section: SessionSection; sessionId: string }

export default function NorthStarSection({ section, sessionId }: Props) {
  const [levers, setLevers]   = useState<Lever[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  const images = Array.isArray((section.content as { images?: string[] })?.images)
    ? (section.content as { images: string[] }).images
    : []

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

      // Merge live lever values with any session-specific snapshots
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
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [sessionId])

  // ── Loading / error states ──────────────────────────────────────────────
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
                {levers.map((lever) => (
                  <FlipCard
                    key={lever.id}
                    lever={lever}
                    compact={key === 'north_star'}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ── Images ───────────────────────────────────────────────── */}
        {images.length > 0 && (
          <div className={`mt-12 grid gap-3 ${images.length === 1 ? 'grid-cols-1 max-w-2xl' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {images.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                className="w-full h-auto rounded-xl border border-white/10"
              />
            ))}
          </div>
        )}

      </div>
    </DarkPageLayout>
  )
}
