'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember } from '@/lib/types'
import DarkPageLayout    from '@/components/DarkPageLayout'
import PresenterBadge   from '@/components/PresenterBadge'

// ─── Content type ─────────────────────────────────────────────────────────

type Content = {
  presenter_id:   string
  presenter_id_2: string
  topic:          string
  duration_min:   number
  demo_url:       string
  body:           string
  watch_for:      string
  images:         string[]
}

// ─── Component ────────────────────────────────────────────────────────────

type Props = { section: SessionSection; sessionId: string }

export default function ShowAndTellSection({ section }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    let cancelled = false
    getBrowserClient().from('team_members').select('*').then(({ data, error: err }) => {
      if (cancelled) return
      if (err) { setError(true); setLoading(false); return }
      setMembers(data ?? [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

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

  const content    = (section.content ?? {}) as Partial<Content>
  const presenter  = members.find((m) => m.id === content.presenter_id)
  const presenter2 = members.find((m) => m.id === content.presenter_id_2)
  const images     = content.images ?? []

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

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-3 flex items-start justify-between">
          <p className="type-eyebrow text-white">Show &amp; Tell</p>
          {presenter && <PresenterBadge presenter={presenter} presenter2={presenter2} />}
        </div>

        {/* ── Title + meta ───────────────────────────────────────────── */}
        <h2 className="type-h2 text-white mt-4 mb-3">
          {content.topic ?? 'Show & Tell'}
        </h2>

        {content.duration_min && (
          <p className="mb-10 text-[14px] text-white/65">
            {content.duration_min} min
          </p>
        )}

        {/* ── Body (rich text with optional table) ───────────────────── */}
        {content.body && (
          <div
            className="prose-table mb-10 max-w-3xl text-[16px] leading-relaxed text-white/65 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1.5 [&_strong]:font-bold [&_strong]:text-white [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: content.body }}
          />
        )}

        {/* ── Pull quote: watch for ───────────────────────────────────── */}
        {content.watch_for && (
          <blockquote className="mb-12 border-l-4 border-primary/50 pl-6 py-2 max-w-2xl">
            <p className="type-eyebrow text-primary/60 mb-2">What to watch for</p>
            <p className="text-[16px] leading-relaxed text-white/65 italic">
              {content.watch_for}
            </p>
          </blockquote>
        )}

        {/* ── Demo launch button ─────────────────────────────────────── */}
        {content.demo_url && (
          <div className="mb-10">
            <a
              href={content.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-[15px] font-bold text-white shadow-elevated transition-all hover:bg-primary/80 hover:shadow-none"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 2a7 7 0 100 14A7 7 0 009 2z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 6.5l5 2.5-5 2.5V6.5z" fill="currentColor"/>
              </svg>
              Launch demo
            </a>
          </div>
        )}

        {/* ── Images ─────────────────────────────────────────────────── */}
        <ImageGrid images={images} />


      </div>
    </DarkPageLayout>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function ImageGrid({ images }: { images: string[] }) {
  if (!images.length) return null
  return (
    <div className={`grid gap-3 mb-10 ${images.length === 1 ? 'grid-cols-1 max-w-2xl' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
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
  )
}
