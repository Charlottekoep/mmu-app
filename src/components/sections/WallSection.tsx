'use client'

import { useEffect, useState, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import DarkPageLayout from '@/components/DarkPageLayout'
import type { SessionSection, TeamMember } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────

type Tab = 'question' | 'comment'

type WallItem = {
  id:               string
  author_name:      string
  comment_text:     string
  tagged_presenter: string | null
  comment_type:     string
  created_at:       string
}

type Props = {
  section:   SessionSection
  sessionId: string
}

// ─── Component ────────────────────────────────────────────────────────────

export default function WallSection({ sessionId }: Props) {
  const [tab,         setTab]         = useState<Tab>('question')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [items,       setItems]       = useState<WallItem[]>([])
  const [author,      setAuthor]      = useState('')
  const [text,        setText]        = useState('')
  const [taggedTo,    setTaggedTo]    = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitErr,   setSubmitErr]   = useState<string | null>(null)

  // Fetch team members once
  useEffect(() => {
    getBrowserClient()
      .from('team_members')
      .select('*')
      .order('name')
      .then(({ data }) => setTeamMembers(data ?? []))
  }, [])

  // Load wall items for this session
  const loadItems = useCallback(async () => {
    const { data } = await getBrowserClient()
      .from('wall_comments')
      .select('id, author_name, comment_text, tagged_presenter, comment_type, created_at')
      .eq('session_id', sessionId)
      .eq('section_type', 'the_wall')
      .order('created_at', { ascending: false })
    if (data) setItems(data as WallItem[])
  }, [sessionId])

  useEffect(() => {
    loadItems()
    const timer = setInterval(loadItems, 10_000)
    return () => clearInterval(timer)
  }, [loadItems])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!author || !text.trim()) return
    setSubmitting(true)
    setSubmitErr(null)
    const { error } = await getBrowserClient()
      .from('wall_comments')
      .insert({
        session_id:       sessionId,
        section_type:     'the_wall',
        comment_type:     tab,
        author_name:      author,
        comment_text:     text.trim(),
        tagged_presenter: tab === 'question' ? (taggedTo || null) : null,
      })
    setSubmitting(false)
    if (error) {
      setSubmitErr('Failed to post. Please try again.')
    } else {
      setText('')
      setTaggedTo('')
      await loadItems()
    }
  }

  const feed       = items.filter((i) => i.comment_type === tab)
  const otherCount = items.filter((i) => i.comment_type !== tab).length

  return (
    <DarkPageLayout>
      <div className="flex h-screen flex-col px-14 pt-24 pb-10 overflow-hidden">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="mb-6 flex-shrink-0">
          <p className="type-eyebrow text-primary mb-1">Session</p>
          <h1
            className="font-black uppercase leading-none text-white"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '0.04em' }}
          >
            The Wall
          </h1>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-shrink-0 gap-2">
          {(['question', 'comment'] as const).map((t) => {
            const count = items.filter((i) => i.comment_type === t).length
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-bold transition-all ${
                  tab === t
                    ? 'text-white'
                    : 'border border-white/20 text-white/45 hover:text-white/75'
                }`}
                style={tab === t ? { background: '#2969FF' } : {}}
              >
                {t === 'question' ? 'Questions' : 'Comments'}
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                      tab === t ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
          {otherCount > 0 && (
            <span className="ml-2 self-center text-[11px] text-white/20">
              {otherCount} {tab === 'question' ? 'comment' : 'question'}{otherCount !== 1 ? 's' : ''} on other tab
            </span>
          )}
        </div>

        {/* ── Two-column layout ─────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 gap-10">

          {/* Left: form */}
          <div className="w-80 flex-shrink-0">
            <p className="type-eyebrow text-white/35 mb-4">
              {tab === 'question' ? 'Ask a question' : 'Leave a comment'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/30"
                style={{ colorScheme: 'dark' }}
              >
                <option value="" disabled>Your name…</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={tab === 'question' ? 'Type your question…' : 'Leave a comment…'}
                rows={4}
                required
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-white placeholder-white/25 focus:outline-none focus:border-white/30"
              />

              {tab === 'question' && (
                <select
                  value={taggedTo}
                  onChange={(e) => setTaggedTo(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] focus:outline-none focus:border-white/30"
                  style={{
                    color:       taggedTo ? 'white' : 'rgba(255,255,255,0.35)',
                    colorScheme: 'dark',
                  }}
                >
                  <option value="">Direct to (optional)</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              )}

              <button
                type="submit"
                disabled={submitting || !author || !text.trim()}
                className="w-full rounded-xl py-3 text-[14px] font-bold text-white transition-opacity disabled:opacity-40"
                style={{ background: '#2969FF' }}
              >
                {submitting ? 'Posting…' : tab === 'question' ? 'Post question' : 'Post comment'}
              </button>

              {submitErr && (
                <p className="text-[12px]" style={{ color: '#D50000' }}>{submitErr}</p>
              )}
            </form>
          </div>

          {/* Right: feed */}
          <div className="min-h-0 flex-1 overflow-y-auto pr-2 space-y-3">
            {feed.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <p className="type-eyebrow text-white/20">
                  No {tab === 'question' ? 'questions' : 'comments'} yet
                </p>
              </div>
            ) : (
              feed.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl p-5"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border:     '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <p className="mb-2 text-[13px] font-bold text-white">{item.author_name}</p>
                  <p className="text-[16px] leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {item.comment_text}
                  </p>
                  {item.tagged_presenter && (
                    <div className="mt-3">
                      <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-[12px] font-bold text-primary">
                        → {item.tagged_presenter}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </DarkPageLayout>
  )
}
