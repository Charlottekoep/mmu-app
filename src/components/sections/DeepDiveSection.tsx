'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember, Lever, LeverSnapshot, RagStatus } from '@/lib/types'
import DarkPageLayout    from '@/components/DarkPageLayout'
import PresenterBadge   from '@/components/PresenterBadge'

// ─── Types ────────────────────────────────────────────────────────────────

type LinkItem = { url: string; label: string }

type Content = {
  title:        string
  presenter_id: string
  lever_id:     string
  body:         string
  links:        LinkItem[]
  images:       string[]
}

type Props = { section: SessionSection; sessionId: string }

// ─── RAG colours ─────────────────────────────────────────────────────────

const RAG_COLOR: Record<RagStatus, string> = {
  green: '#1FC881',
  amber: '#FFAB00',
  red:   '#D50000',
}

// ─── Component ────────────────────────────────────────────────────────────

export default function DeepDiveSection({ section, sessionId }: Props) {
  const [members,  setMembers]  = useState<TeamMember[]>([])
  const [levers,   setLevers]   = useState<Lever[]>([])
  const [snaps,    setSnaps]    = useState<LeverSnapshot[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getBrowserClient().from('team_members').select('*'),
      getBrowserClient().from('levers').select('*'),
      getBrowserClient().from('lever_snapshots').select('*').eq('session_id', sessionId),
    ]).then(([membersRes, leversRes, snapsRes]) => {
      if (cancelled) return
      if (membersRes.error || leversRes.error) { setError(true); setLoading(false); return }
      setMembers(membersRes.data ?? [])
      setLevers(leversRes.data ?? [])
      setSnaps(snapsRes.data ?? [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [sessionId])

  if (loading || error) {
    return (
      <DarkPageLayout>
        <div className="flex h-screen items-center justify-center">
          {error
            ? <p className="type-eyebrow text-red">Failed to load</p>
            : <p className="type-eyebrow text-white/30">Loading…</p>}
        </div>
      </DarkPageLayout>
    )
  }

  const content   = (section.content ?? {}) as Partial<Content>
  const presenter = members.find((m) => m.id === content.presenter_id)
  const images    = content.images ?? []

  // Resolve lever — use snapshot RAG if available
  const baseLever = levers.find((l) => l.id === content.lever_id)
  const snap      = snaps.find((s) => s.lever_id === content.lever_id)
  const lever     = baseLever
    ? { ...baseLever, rag_status: snap?.rag_status ?? baseLever.rag_status }
    : null

  const links = (content.links ?? []).filter((l) => l.url)

  return (
    <DarkPageLayout>
      <style>{`
        .prose-table table {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
          margin: 16px 0;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.20);
          border-radius: 8px;
          overflow: hidden;
        }
        .prose-table th {
          background: #2969FF;
          color: white;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 12px 16px;
          text-align: left;
          border-right: 1px solid rgba(255,255,255,0.25);
          border-bottom: 1px solid rgba(255,255,255,0.30);
        }
        .prose-table th:last-child { border-right: none; }
        .prose-table td {
          color: white;
          font-size: 14px;
          padding: 12px 16px;
          text-align: left;
          border-right: 1px solid rgba(255,255,255,0.15);
          border-bottom: 1px solid rgba(255,255,255,0.15);
        }
        .prose-table td:last-child { border-right: none; }
        .prose-table tr:last-child td { border-bottom: none; }
        .prose-table tbody tr:nth-child(even) td { background: rgba(255,255,255,0.08); }
        .prose-table tbody tr:nth-child(odd) td { background: transparent; }
      `}</style>
      <div className="h-screen overflow-y-auto px-14 pt-24 pb-20">

        {/* ── Top bar: lever badge + presenter ───────────────────────── */}
        <div className="mb-8 flex items-start justify-between gap-6">
          <div className="flex flex-col gap-3">
            {/* Lever badge */}
            {lever && (
              <div className="flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: RAG_COLOR[lever.rag_status] }}
                />
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/65">
                  {lever.name}
                </span>
              </div>
            )}
            {/* Eyebrow */}
            <p className="type-eyebrow text-white">Deep Dive</p>
          </div>

          {/* Presenter */}
          {presenter && <PresenterBadge presenter={presenter} />}
        </div>

        {/* ── Title ──────────────────────────────────────────────────── */}
        <h2 className="type-h2 text-white mb-10">
          {content.title ?? 'Deep Dive'}
        </h2>

        {/* ── Body ───────────────────────────────────────────────────── */}
        {content.body && (
          <div
            className="prose-table mb-10 max-w-3xl text-[16px] leading-relaxed text-white/65 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1.5 [&_strong]:font-bold [&_strong]:text-white [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: content.body }}
          />
        )}

        {/* ── Additional images ──────────────────────────────────────── */}
        <ImageGrid images={images} />

        {/* ── Links ──────────────────────────────────────────────────── */}
        {links.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-3">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-[13px] font-medium text-primary transition-all hover:bg-primary/20"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M1 11L11 1M11 1H4M11 1v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {link.label || link.url}
              </a>
            ))}
          </div>
        )}

      </div>
    </DarkPageLayout>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function ImageGrid({ images }: { images: string[] }) {
  if (!images.length) return null
  const cols =
    images.length === 1 ? 'grid-cols-1 max-w-2xl'
    : images.length === 2 ? 'grid-cols-2'
    : 'grid-cols-3'
  return (
    <div className={`grid gap-4 mb-10 ${cols}`}>
      {images.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={url}
          alt=""
          className="w-full h-auto rounded-xl border border-white/10 object-contain"
        />
      ))}
    </div>
  )
}
