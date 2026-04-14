'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember, LeaderboardEntry } from '@/lib/types'
import DarkPageLayout from '@/components/DarkPageLayout'

// ─── Types ────────────────────────────────────────────────────────────────

type QuizItem = { question: string; answer: string }

type Content = {
  presenter_id: string
  concept:      string
  quiz:         QuizItem[]
  images:       string[]
}

type RankedEntry = LeaderboardEntry & { member: TeamMember }

// ─── Medal colours ────────────────────────────────────────────────────────

const MEDAL: Record<number, { color: string; bg: string; label: string }> = {
  0: { color: '#FFD700', bg: 'rgba(255,215,0,0.12)',  label: '🥇' },
  1: { color: '#C0C0C0', bg: 'rgba(192,192,192,0.10)', label: '🥈' },
  2: { color: '#CD7F32', bg: 'rgba(205,127,50,0.10)',  label: '🥉' },
}

// ─── Component ────────────────────────────────────────────────────────────

type Props = { section: SessionSection; sessionId: string }

export default function TheLeagueSection({ section }: Props) {
  const [members,     setMembers]     = useState<TeamMember[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(false)
  const [revealed,    setRevealed]    = useState<Set<number>>(new Set())
  const [quizIndex,   setQuizIndex]   = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getBrowserClient().from('team_members').select('*').order('name'),
      getBrowserClient().from('leaderboard_entries').select('*').order('score', { ascending: false }),
    ]).then(([membersRes, lbRes]) => {
      if (cancelled) return
      if (membersRes.error) { setError(true); setLoading(false); return }
      setMembers(membersRes.data ?? [])
      setLeaderboard(lbRes.data ?? [])
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
  const quiz      = (content.quiz ?? []).filter((q) => q.question)
  const images    = content.images ?? []

  // Join leaderboard with members and sort by score desc
  const ranked: RankedEntry[] = leaderboard
    .map((entry) => {
      const member = members.find((m) => m.id === entry.team_member_id)
      return member ? { ...entry, member } : null
    })
    .filter((e): e is RankedEntry => e !== null)
    .sort((a, b) => b.score - a.score)

  function toggleReveal(i: number) {
    setRevealed((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <DarkPageLayout>
      <div className="h-screen overflow-y-auto px-14 pt-24 pb-20">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="type-eyebrow text-white mb-3">The League</p>
            <h2 className="type-h2 text-white">Insurance IQ</h2>
          </div>
          {presenter && (
            <div className="flex items-center gap-3">
              <MemberAvatar member={presenter} size={40} />
              <div>
                <p className="text-[13px] font-bold text-white">{presenter.name}</p>
                <p className="text-[11px] text-white/65">{presenter.role}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">

            {/* ── Insurance concept ────────────────────────────────── */}
            {content.concept && (
              <section>
                <p className="type-eyebrow text-white mb-4">This week&apos;s concept</p>
                <div
                  className="text-[16px] leading-relaxed text-white/65 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1.5 [&_strong]:font-bold [&_strong]:text-white [&_em]:italic max-w-2xl"
                  dangerouslySetInnerHTML={{ __html: content.concept }}
                />
              </section>
            )}

            {/* ── Quiz ─────────────────────────────────────────────── */}
            {quiz.length > 0 && (
              <section>
                <p className="type-eyebrow text-white mb-4">
                  Quiz · {quizIndex + 1}/{quiz.length}
                </p>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 max-w-2xl">
                  <p className="text-[18px] font-bold text-white mb-6">
                    {quiz[quizIndex].question}
                  </p>

                  {revealed.has(quizIndex) ? (
                    <div className="rounded-xl bg-green/10 border border-green/20 px-5 py-4">
                      <p className="type-eyebrow text-green/70 mb-1.5">Answer</p>
                      <p className="text-[16px] text-white/85">{quiz[quizIndex].answer}</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleReveal(quizIndex)}
                      className="rounded-xl border border-white/15 bg-white/[0.06] px-6 py-3 text-[13px] font-bold text-white/60 transition-all hover:bg-white/10 hover:text-white"
                    >
                      Reveal answer
                    </button>
                  )}

                  {/* Quiz navigation */}
                  {quiz.length > 1 && (
                    <div className="mt-6 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuizIndex((i) => Math.max(0, i - 1))}
                        disabled={quizIndex === 0}
                        className="rounded-full border border-white/20 px-4 py-1.5 text-[12px] text-white/65 transition-all hover:border-white/40 hover:text-white disabled:opacity-25"
                      >
                        ← Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuizIndex((i) => Math.min(quiz.length - 1, i + 1))}
                        disabled={quizIndex === quiz.length - 1}
                        className="rounded-full border border-white/20 px-4 py-1.5 text-[12px] text-white/65 transition-all hover:border-white/40 hover:text-white disabled:opacity-25"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── Images ───────────────────────────────────────────── */}
            <ImageGrid images={images} />

          </div>

          {/* ── Leaderboard ──────────────────────────────────────────── */}
          <aside>
            <p className="type-eyebrow text-white mb-4">Leaderboard</p>
            <div className="space-y-2">
              {ranked.map((entry, rank) => {
                const medal = MEDAL[rank]
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                    style={{
                      background:   medal ? medal.bg    : 'rgba(255,255,255,0.03)',
                      borderColor:  medal ? medal.color : 'rgba(255,255,255,0.08)',
                      borderWidth:  '1px',
                      borderStyle:  'solid',
                    }}
                  >
                    {/* Rank */}
                    <span className="w-6 text-center text-[18px] leading-none">
                      {medal ? medal.label : (
                        <span className="text-[13px] font-bold text-white/65">
                          {rank + 1}
                        </span>
                      )}
                    </span>

                    {/* Avatar */}
                    <MemberAvatar member={entry.member} size={32} />

                    {/* Name */}
                    <span
                      className="flex-1 text-[14px] font-medium truncate"
                      style={{ color: medal ? medal.color : 'rgba(255,255,255,0.9)' }}
                    >
                      {entry.member.name}
                    </span>

                    {/* Score */}
                    <span
                      className="text-[16px] font-black tabular-nums"
                      style={{ color: medal ? medal.color : 'rgba(255,255,255,0.65)' }}
                    >
                      {entry.score}
                    </span>
                  </div>
                )
              })}
              {ranked.length === 0 && (
                <p className="type-eyebrow text-white/65 py-4">No scores yet</p>
              )}
            </div>
          </aside>
        </div>

      </div>
    </DarkPageLayout>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function ImageGrid({ images }: { images: string[] }) {
  if (!images.length) return null
  return (
    <div className={`grid gap-3 ${images.length === 1 ? 'grid-cols-1 max-w-2xl' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
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
