'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { TeamMember } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────

const ADMIN_EMAILS = ['charlotte@root.co.za', 'jonny@rootplatform.com']

const SECTION_NAMES: Record<string, string> = {
  welcome:       'Welcome',
  just_humans:   'Just Humans',
  north_star:    'North Star',
  deep_dive:     'Deep Dive',
  show_and_tell: 'Show & Tell',
  announcements: 'Announcements',
  the_league:    'The League',
}

// ─── Types ────────────────────────────────────────────────────────────────

type WallComment = {
  id:               string
  session_id:       string
  section_type:     string
  author_name:      string
  comment_text:     string
  tagged_presenter: string | null
  is_addressed:     boolean
  is_pinned:        boolean
  created_at:       string
}

type Props = {
  sessionId:          string
  currentSectionType: string
  teamMembers:        TeamMember[]
}

// ─── Component ────────────────────────────────────────────────────────────

export default function Wall({ sessionId, currentSectionType, teamMembers }: Props) {
  const [open,          setOpen]          = useState(false)
  const [comments,      setComments]      = useState<WallComment[]>([])
  const [userEmail,     setUserEmail]     = useState<string | null>(null)
  const [overlayId,     setOverlayId]     = useState<string | null>(null)
  const [author,        setAuthor]        = useState('')
  const [text,          setText]          = useState('')
  const [taggedTo,      setTaggedTo]      = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [submitErr,     setSubmitErr]     = useState<string | null>(null)

  const isAdmin = !!userEmail && ADMIN_EMAILS.includes(userEmail)

  // ── Auth ──────────────────────────────────────────────────────────────
  useEffect(() => {
    getBrowserClient().auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null)
    })
  }, [])

  // ── Comment loading ───────────────────────────────────────────────────
  const loadComments = useCallback(async () => {
    const { data } = await getBrowserClient()
      .from('wall_comments')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
    if (data) setComments(data as WallComment[])
  }, [sessionId])

  useEffect(() => {
    loadComments()
    const timer = setInterval(loadComments, 10_000)
    return () => clearInterval(timer)
  }, [loadComments])

  // ── Realtime subscription for pin events ──────────────────────────────
  useEffect(() => {
    const supabase = getBrowserClient()
    const channel = supabase
      .channel(`wall:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'wall_comments',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const inserted = payload.new as WallComment
          setComments((prev) => [inserted, ...prev])
          if (inserted.is_pinned) setOverlayId(inserted.id)
        },
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'wall_comments',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as WallComment
          setComments((prev) => prev.map((c) => c.id === updated.id ? updated : c))
          if (updated.is_pinned) setOverlayId(updated.id)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  // ── Actions ───────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!author || !text.trim()) return
    setSubmitting(true)
    setSubmitErr(null)
    const { error } = await getBrowserClient()
      .from('wall_comments')
      .insert({
        session_id:       sessionId,
        section_type:     currentSectionType,
        author_name:      author,
        comment_text:     text.trim(),
        tagged_presenter: taggedTo || null,
      })
    setSubmitting(false)
    if (error) {
      setSubmitErr('Failed to post. Please try again.')
    } else {
      setText('')
      setTaggedTo('')
      await loadComments()
    }
  }

  async function handleMarkAddressed(id: string) {
    await getBrowserClient()
      .from('wall_comments')
      .update({ is_addressed: true })
      .eq('id', id)
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, is_addressed: true } : c))
  }

  async function handlePin(id: string) {
    await getBrowserClient()
      .from('wall_comments')
      .update({ is_pinned: true })
      .eq('id', id)
    // Update local state immediately; realtime handles other viewers
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, is_pinned: true } : c))
    setOverlayId(id)
  }

  // ── Derived state ─────────────────────────────────────────────────────
  // Pinned comments float to the top, then most-recent-first
  const sorted = [...comments].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const overlayComment = overlayId ? comments.find((c) => c.id === overlayId) ?? null : null
  const totalCount     = comments.length

  return (
    <>
      {/* ── Pinned overlay ─────────────────────────────────────────────── */}
      {overlayComment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.65)' }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-8"
            style={{ background: '#0F1B4A', border: '2px solid #2969FF' }}
          >
            <div className="mb-5 flex items-center gap-2">
              <span className="text-sm leading-none">📌</span>
              <span className="type-eyebrow text-primary">Pinned</span>
            </div>
            <p className="mb-2 text-[15px] font-bold text-white">
              {overlayComment.author_name}
            </p>
            <p className="text-[17px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {overlayComment.comment_text}
            </p>
            {overlayComment.tagged_presenter && (
              <div className="mt-4">
                <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-[12px] font-bold text-primary">
                  → {overlayComment.tagged_presenter}
                </span>
              </div>
            )}
            <div className="mt-7 flex justify-end">
              <button
                onClick={() => setOverlayId(null)}
                className="rounded-full border border-white/20 px-5 py-2.5 text-[13px] text-white/60 transition-all hover:bg-white/10 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Wall toggle button ──────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle session wall"
        className="fixed bottom-8 left-8 z-30 flex items-center gap-1.5 rounded-full px-4 py-2.5 type-eyebrow text-white transition-colors"
        style={{ background: '#1a2a5e', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <span>💬</span>
        {totalCount > 0 && <span>{totalCount}</span>}
        <span>Wall</span>
      </button>

      {/* ── Slide-up panel ─────────────────────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl transition-transform duration-300 ease-out"
        style={{
          maxHeight:    '60vh',
          background:   '#0F1B4A',
          border:       '1px solid rgba(255,255,255,0.10)',
          borderBottom: 'none',
          transform:    open ? 'translateY(0)' : 'translateY(100%)',
        }}
        // Prevent slide clicks from propagating to PresentationShell nav
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
          <span className="type-eyebrow text-white">Session Wall</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close wall"
            className="p-1 text-white/40 transition-colors hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Comment list */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {sorted.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-white/30">
              No comments yet — be the first to post!
            </p>
          ) : (
            sorted.map((c) => (
              <div
                key={c.id}
                className="group relative rounded-xl p-4 transition-opacity"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border:     c.is_pinned ? '1px solid #2969FF' : '1px solid rgba(255,255,255,0.10)',
                  opacity:    c.is_addressed ? 0.4 : 1,
                }}
              >
                {/* Pinned label */}
                {c.is_pinned && (
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="text-[11px] leading-none">📌</span>
                    <span className="type-eyebrow text-primary" style={{ fontSize: '10px' }}>PINNED</span>
                  </div>
                )}

                {/* Author row + pin button */}
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-[14px] font-bold text-white">{c.author_name}</p>
                  {isAdmin && !c.is_pinned && (
                    <button
                      onClick={() => handlePin(c.id)}
                      aria-label="Pin for everyone"
                      title="Pin for everyone"
                      className="p-1 text-white/25 opacity-0 transition-all group-hover:opacity-100 hover:text-primary"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 2l2.4 6.4H21l-5.4 4 2 6.6L12 15.3l-5.6 3.7 2-6.6L3 8.4h6.6L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Comment text */}
                <p className="text-[14px] leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {c.comment_text}
                </p>

                {/* Tagged presenter pill */}
                {c.tagged_presenter && (
                  <span className="mt-2 inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    → {c.tagged_presenter}
                  </span>
                )}

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-white/30">
                    posted during {SECTION_NAMES[c.section_type] ?? c.section_type}
                  </p>
                  {!c.is_addressed && (
                    <button
                      onClick={() => handleMarkAddressed(c.id)}
                      className="text-[11px] text-white/30 transition-colors hover:text-white/60"
                    >
                      Mark addressed
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add comment form */}
        <form
          onSubmit={handleSubmit}
          className="flex-shrink-0 space-y-3 border-t border-white/10 px-6 py-4"
        >
          <div className="flex gap-3">
            <select
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/30"
              style={{ colorScheme: 'dark' }}
            >
              <option value="" disabled>Your name…</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
            <select
              value={taggedTo}
              onChange={(e) => setTaggedTo(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] focus:outline-none focus:border-white/30"
              style={{ color: taggedTo ? 'white' : 'rgba(255,255,255,0.4)', colorScheme: 'dark' }}
            >
              <option value="">Direct to (optional)</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask a question or leave a comment…"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
            <button
              type="submit"
              disabled={submitting || !author || !text.trim()}
              className="rounded-lg px-5 py-2 text-[13px] font-bold text-white transition-opacity disabled:opacity-40"
              style={{ background: '#2969FF' }}
            >
              {submitting ? '…' : 'Post'}
            </button>
          </div>

          {submitErr && (
            <p className="text-[12px]" style={{ color: '#D50000' }}>{submitErr}</p>
          )}
        </form>
      </div>
    </>
  )
}
