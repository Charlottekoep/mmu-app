'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember } from '@/lib/types'
import DarkPageLayout from '@/components/DarkPageLayout'

// ─── Content type ─────────────────────────────────────────────────────────

type Content = {
  presenter_id: string
  topic:        string
  duration_min: number
  demo_url:     string
  body:         string
  watch_for:    string
  images:       string[]
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

  const content   = (section.content ?? {}) as Partial<Content>
  const presenter = members.find((m) => m.id === content.presenter_id)
  const images    = content.images ?? []

  return (
    <DarkPageLayout>
      <style>{`
        .prose-table table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        .prose-table th, .prose-table td { border: 1px solid rgba(255,255,255,0.15); padding: 8px 12px; text-align: left; }
        .prose-table th { background: rgba(255,255,255,0.08); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.9); }
        .prose-table td { font-size: 14px; color: rgba(255,255,255,0.65); }
      `}</style>
      <div className="h-screen overflow-y-auto px-14 pt-24 pb-20">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-3 flex items-start justify-between">
          <p className="type-eyebrow text-white">Show &amp; Tell</p>
          {presenter && (
            <div className="flex items-center gap-3">
              <MemberAvatar member={presenter} size={36} />
              <div>
                <p className="text-[13px] font-bold text-white">{presenter.name}</p>
                <p className="text-[11px] text-white/65">{presenter.role}</p>
              </div>
            </div>
          )}
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

        {/* ── Feedback area ──────────────────────────────────────────── */}
        <div className="mt-10">
          <p className="type-eyebrow text-white/20 mb-4">Reactions</p>
          <div className="flex flex-wrap gap-4">
            {(['👍', '💡', '🔥', '🤔'].map((emoji, i) => (
              <div
                key={i}
                className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-3xl text-white/15"
              >
                {emoji}
              </div>
            )))}
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-white/10 text-[11px] font-bold uppercase tracking-widest text-white/15">
              Reactions<br />coming soon
            </div>
          </div>
        </div>

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

function MemberAvatar({ member, size }: { member: TeamMember | undefined; size: number }) {
  const s = `${size}px`
  if (!member) return <div className="rounded-full bg-white/10" style={{ width: s, height: s }} />

  if (member.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={member.photo_url} alt={member.name}
        className="flex-shrink-0 rounded-full object-cover border border-white/15"
        style={{ width: s, height: s }}
      />
    )
  }
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-primary/20 font-black text-primary"
      style={{ width: s, height: s, fontSize: `${size * 0.4}px` }}
    >
      {member.name[0]}
    </div>
  )
}
