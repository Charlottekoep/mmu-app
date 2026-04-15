'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember } from '@/lib/types'
import DarkPageLayout  from '@/components/DarkPageLayout'
import TeamAvatar      from '@/components/TeamAvatar'
import PresenterBadge  from '@/components/PresenterBadge'

// ─── Types ────────────────────────────────────────────────────────────────

type QuizItem = { question: string; answer: string }

type LeaderboardRow = { name: string; score: number }

type Content = {
  presenter_id:    string
  concept:         string
  quiz:            QuizItem[]
  images:          string[]
  leaderboard_data: LeaderboardRow[]
}

type RankedEntry = LeaderboardRow & { member?: TeamMember }

// ─── Medal colours ────────────────────────────────────────────────────────

const MEDAL: Record<number, { color: string; bg: string; label: string }> = {
  0: { color: '#FFD700', bg: 'rgba(255,215,0,0.12)',   label: '🥇' },
  1: { color: '#C0C0C0', bg: 'rgba(192,192,192,0.10)', label: '🥈' },
  2: { color: '#CD7F32', bg: 'rgba(205,127,50,0.10)',  label: '🥉' },
}

// ─── Component ────────────────────────────────────────────────────────────

type Props = { section: SessionSection; sessionId: string }

export default function TheLeagueSection({ section }: Props) {
  const [members,           setMembers]           = useState<TeamMember[]>([])
  const [loading,           setLoading]           = useState(true)
  const [error,             setError]             = useState(false)
  const [questionsRevealed, setQuestionsRevealed] = useState(false)
  const [answersRevealed,   setAnswersRevealed]   = useState(false)

  useEffect(() => {
    let cancelled = false
    getBrowserClient()
      .from('team_members')
      .select('*')
      .order('name')
      .then(({ data, error: err }) => {
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
  const quiz      = (content.quiz ?? []).filter((q) => q.question)
  const images    = content.images ?? []

  // Build ranked list from uploaded CSV data, enriched with team member avatars
  const ranked: RankedEntry[] = (content.leaderboard_data ?? [])
    .map((row) => ({
      ...row,
      member: members.find((m) => m.name.toLowerCase() === row.name.toLowerCase()),
    }))
    .sort((a, b) => b.score - a.score)

  return (
    <DarkPageLayout>
      <div className="h-screen overflow-y-auto px-14 pt-24 pb-20">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="type-eyebrow text-white mb-3">The League</p>
            <h2 className="type-h2 text-white">Insurance IQ</h2>
          </div>
          {presenter && <PresenterBadge presenter={presenter} />}
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
                  Quiz · {quiz.length} question{quiz.length !== 1 ? 's' : ''}
                </p>

                {!questionsRevealed ? (
                  <button
                    type="button"
                    onClick={() => setQuestionsRevealed(true)}
                    className="rounded-xl border border-white/15 bg-white/[0.06] px-6 py-3.5 text-[14px] font-bold text-white transition-all hover:bg-white/10"
                  >
                    Reveal questions
                  </button>
                ) : (
                  <div className="max-w-2xl space-y-4">
                    {quiz.map((q, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-white/10 bg-white/[0.05] p-6"
                      >
                        <p className="type-eyebrow text-white/35 mb-2">Q{i + 1}</p>
                        <p className="text-[18px] font-bold text-white">{q.question}</p>

                        {answersRevealed && q.answer && (
                          <div className="mt-4 rounded-xl bg-green/10 border border-green/20 px-5 py-4">
                            <p className="type-eyebrow text-green/70 mb-1.5">Answer</p>
                            <p className="text-[15px] text-white/85">{q.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {!answersRevealed && (
                      <button
                        type="button"
                        onClick={() => setAnswersRevealed(true)}
                        className="mt-2 rounded-xl border border-green/30 bg-green/10 px-6 py-3.5 text-[14px] font-bold text-green/80 transition-all hover:bg-green/15 hover:text-green"
                      >
                        Reveal answers
                      </button>
                    )}
                  </div>
                )}
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
                    key={rank}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                    style={{
                      background:  medal ? medal.bg    : 'rgba(255,255,255,0.03)',
                      borderColor: medal ? medal.color : 'rgba(255,255,255,0.08)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
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

                    {/* Avatar — matched by name, graceful fallback if no match */}
                    <TeamAvatar member={entry.member} size={32} className="border border-white/15" />

                    {/* Name */}
                    <span
                      className="flex-1 text-[14px] font-medium truncate"
                      style={{ color: medal ? medal.color : 'rgba(255,255,255,0.9)' }}
                    >
                      {entry.name}
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
