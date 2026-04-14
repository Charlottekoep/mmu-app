'use client'

import { useState, useEffect, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────

type Reaction = {
  id:            string
  reaction_text: string
  created_at:    string
}

type Props = {
  sessionId:   string
  sectionType: string
}

// ─── Component ────────────────────────────────────────────────────────────

export default function ReactionPanel({ sessionId, sectionType }: Props) {
  const [open,       setOpen]       = useState(false)
  const [reactions,  setReactions]  = useState<Reaction[]>([])
  const [text,       setText]       = useState('')
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  // ── Fetch reactions for this section ──────────────────────────────────

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setReactions([])
    getBrowserClient()
      .from('reactions')
      .select('id, reaction_text, created_at')
      .eq('session_id', sessionId)
      .eq('section_type', sectionType)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return
        setReactions(data ?? [])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [sessionId, sectionType])

  // ── Focus input when panel opens ──────────────────────────────────────

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 320)
  }, [open])

  // ── Submit ────────────────────────────────────────────────────────────

  async function submit() {
    const trimmed = text.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    const { data, error } = await getBrowserClient()
      .from('reactions')
      .insert({ session_id: sessionId, section_type: sectionType, reaction_text: trimmed })
      .select('id, reaction_text, created_at')
      .single()
    if (data && !error) {
      setReactions((prev) => [data, ...prev])
      setText('')
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setSubmitting(false)
  }

  // ── Keyboard handling — prevent arrow keys reaching the slide navigator

  function handleKey(e: React.KeyboardEvent) {
    // Always stop slide navigation keys from bubbling when input is focused
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.nativeEvent.stopImmediatePropagation()
    }
    if (e.key === 'Enter')  submit()
    if (e.key === 'Escape') setOpen(false)
  }

  const count = reactions.length

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 flex flex-col items-center pointer-events-none">

      {/* ── Expanded panel — slides up from above the tab ─────────────── */}
      <div
        className="pointer-events-auto w-full max-w-xl"
        style={{
          maxHeight:  open ? '35vh' : '0',
          overflow:   'hidden',
          transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className="flex flex-col rounded-t-2xl border border-b-0 border-white/10 px-5 pt-4 pb-3"
          style={{ background: '#0F1B4A', height: '35vh' }}
        >
          {/* Reactions list */}
          <div
            ref={listRef}
            className="flex-1 min-h-0 overflow-y-auto space-y-2 mb-3"
          >
            {loading ? (
              <p className="py-6 text-center text-[12px] text-white/30">Loading…</p>
            ) : reactions.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-white/30">
                No reactions yet — be the first!
              </p>
            ) : (
              reactions.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <p className="text-[14px] leading-snug text-white">{r.reaction_text}</p>
                  <p className="mt-1 text-[11px] text-white/35">
                    {new Date(r.created_at).toLocaleTimeString('en-GB', {
                      hour:   '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Input row */}
          <div className="flex flex-shrink-0 gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Add a reaction…"
              className="flex-1 rounded-lg border border-white/20 bg-white/[0.06] px-4 py-2.5 text-[14px] text-white placeholder-white/30 outline-none transition-colors focus:border-white/40"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!text.trim() || submitting}
              className="rounded-lg border border-primary/40 bg-primary/15 px-5 py-2.5 text-[13px] font-bold text-primary transition-all hover:bg-primary/25 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* ── Collapsed tab ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto mt-2 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-medium text-white/65 transition-all hover:text-white"
        style={{
          background: 'rgba(255,255,255,0.10)',
          border:     '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <span>💬</span>
        <span>{count > 0 ? count : 'Reactions'}</span>
        <svg
          width="10" height="7" viewBox="0 0 10 7" fill="none"
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M1 6L5 2L9 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

    </div>
  )
}
