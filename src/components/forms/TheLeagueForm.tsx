'use client'

import { useState, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember, LeaderboardEntry } from '@/lib/types'
import RichTextEditor from '@/components/RichTextEditor'
import ImageUploader  from '@/components/ImageUploader'
import TeamAvatar     from '@/components/TeamAvatar'

// ─── Shared styles ────────────────────────────────────────────────────────

const fieldLabel = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls   = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'
const selectCls  = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] outline-none transition-colors focus:border-[#2969FF] appearance-none'

// ─── Types ────────────────────────────────────────────────────────────────

type QuizItem = { question: string; answer: string }

type Content = {
  presenter_id:  string
  concept:       string
  quiz:          QuizItem[]
  images:        string[]
}

type ScoreDelta = Record<string, number>   // teamMemberId → delta (can be negative)

type Props = {
  section:     SessionSection
  sessionId:   string
  teamMembers: TeamMember[]
  leaderboard: LeaderboardEntry[]
}

// ─── Component ────────────────────────────────────────────────────────────

export default function TheLeagueForm({ section, sessionId, teamMembers, leaderboard }: Props) {
  const raw = section.content as Partial<Content>

  const [is_active,    setIsActive]   = useState(section.is_active)
  const [presenter_id, setPresenter]  = useState(raw.presenter_id  ?? '')
  const [concept,      setConcept]    = useState(raw.concept       ?? '')
  const [quiz,         setQuiz]       = useState<QuizItem[]>(
    (raw.quiz ?? []).length > 0 ? (raw.quiz as QuizItem[]) : [{ question: '', answer: '' }],
  )
  const [images,       setImages]     = useState<string[]>(raw.images ?? [])
  const [deltas,       setDeltas]     = useState<ScoreDelta>({})
  const [saving,       setSaving]     = useState(false)
  const [saved,        setSaved]      = useState(false)
  const [saveError,    setSaveError]  = useState(false)
  const [scoreSaving,  setScoreSaving] = useState<string | null>(null)

  // Map leaderboard for quick lookup
  const scoreMap = new Map(leaderboard.map((e) => [e.team_member_id, e]))

  const persist = useCallback(async (patch: Partial<Content & { is_active?: boolean }>) => {
    setSaving(true); setSaved(false); setSaveError(false)
    const content: Content = {
      presenter_id: patch.presenter_id ?? presenter_id,
      concept:      patch.concept      ?? concept,
      quiz:         patch.quiz         ?? quiz,
      images:       patch.images       ?? images,
    }
    const active = patch.is_active !== undefined ? patch.is_active : is_active
    const { error: err } = await getBrowserClient()
      .from('session_sections')
      .update({ content, is_active: active })
      .eq('id', section.id)
    if (err) { setSaving(false); setSaveError(true); setTimeout(() => setSaveError(false), 3000); return }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [presenter_id, concept, quiz, images, is_active, section.id])

  function toggleActive() {
    const next = !is_active
    setIsActive(next)
    persist({ is_active: next })
  }

  // Quiz
  function addQuiz()           { setQuiz((q) => [...q, { question: '', answer: '' }]) }
  function removeQuiz(i: number) {
    const next = quiz.filter((_, idx) => idx !== i)
    setQuiz(next); persist({ quiz: next })
  }

  // Score delta helper
  function getDelta(memberId: string) { return deltas[memberId] ?? 0 }
  function setDelta(memberId: string, val: number) {
    setDeltas((d) => ({ ...d, [memberId]: val }))
  }

  async function applyScore(memberId: string) {
    const delta = getDelta(memberId)
    if (delta === 0) return
    const entry = scoreMap.get(memberId)
    const currentScore = entry?.score ?? 0
    const newScore = Math.max(0, currentScore + delta)
    setScoreSaving(memberId)
    await getBrowserClient()
      .from('leaderboard_entries')
      .update({ score: newScore, updated_at: new Date().toISOString() })
      .eq('team_member_id', memberId)
    setScoreSaving(null)
    setDeltas((d) => ({ ...d, [memberId]: 0 }))
    if (entry) entry.score = newScore
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 space-y-8">
      <SaveIndicator saving={saving} saved={saved} error={saveError} />

      {/* Active toggle */}
      <div className="flex items-center justify-between rounded-xl border border-[#DEDEDE] bg-white px-5 py-4">
        <div>
          <p className="text-[14px] font-medium text-[#262626]">Include in this session</p>
          <p className="text-[12px] text-[#5A5A5A]">Toggle off to skip The League this week</p>
        </div>
        <button
          type="button"
          onClick={toggleActive}
          className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${is_active ? 'bg-primary' : 'bg-[#DEDEDE]'}`}
          role="switch"
          aria-checked={is_active}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Presenter */}
      <div>
        <label className={fieldLabel}>Presenter</label>
        <div className="flex items-center gap-3">
          <TeamAvatar member={teamMembers.find((m) => m.id === presenter_id)} size={36} className="border border-[#DEDEDE]" />
          <select
            value={presenter_id}
            onChange={(e) => { setPresenter(e.target.value); persist({ presenter_id: e.target.value }) }}
            className={selectCls}
          >
          <option value="">— select —</option>
          {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        </div>
      </div>

      {/* Insurance concept */}
      <div>
        <label className={fieldLabel}>Insurance concept</label>
        <RichTextEditor
          value={concept}
          onChange={(html) => { setConcept(html); persist({ concept: html }) }}
          placeholder="Explain the insurance concept being covered this week…"
          minHeight={160}
        />
      </div>

      {/* Quiz */}
      <div>
        <label className={fieldLabel}>Quiz questions</label>
        <div className="space-y-3">
          {quiz.map((q, i) => (
            <div key={i} className="rounded-xl border border-[#DEDEDE] bg-white p-4 space-y-2">
              <div className="flex items-start justify-between">
                <span className="type-eyebrow text-[#969696]">Q{i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeQuiz(i)}
                  className="text-[#969696] hover:text-red transition-colors"
                  aria-label="Remove question"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={q.question}
                onChange={(e) => { const v = e.target.value; setQuiz((prev) => prev.map((item, idx) => idx === i ? { ...item, question: v } : item)) }}
                onBlur={() => persist({ quiz })}
                placeholder="Question…"
                className={inputCls}
              />
              <input
                type="text"
                value={q.answer}
                onChange={(e) => { const v = e.target.value; setQuiz((prev) => prev.map((item, idx) => idx === i ? { ...item, answer: v } : item)) }}
                onBlur={() => persist({ quiz })}
                placeholder="Answer…"
                className={inputCls}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addQuiz}
            className="text-[12px] text-primary/60 hover:text-primary transition-colors"
          >
            + Add question
          </button>
        </div>
      </div>

      {/* Images */}
      <div>
        <label className={fieldLabel}>Images</label>
        <ImageUploader
          images={images}
          folder={`${sessionId}/${section.id}`}
          onChange={(imgs) => { setImages(imgs); persist({ images: imgs }) }}
        />
      </div>

      {/* Leaderboard score adjustments */}
      <div>
        <label className={fieldLabel}>Score adjustments</label>
        <p className="mb-3 text-[12px] text-[#5A5A5A]">
          Award or deduct points after the quiz. Changes are permanent.
        </p>
        <div className="space-y-2">
          {teamMembers.map((member) => {
            const entry   = scoreMap.get(member.id)
            const score   = entry?.score ?? 0
            const delta   = getDelta(member.id)
            const pending = delta !== 0
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-[#DEDEDE] bg-white px-4 py-3"
              >
                {/* Member */}
                <span className="flex-1 text-[13px] font-medium text-[#262626]">{member.name}</span>

                {/* Current score */}
                <span className="w-10 text-right text-[13px] text-[#5A5A5A]">
                  {score + delta}
                </span>

                {/* − */}
                <button
                  type="button"
                  onClick={() => setDelta(member.id, delta - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#DEDEDE] text-[#5A5A5A] hover:border-red/40 hover:text-red transition-colors text-[16px]"
                  aria-label={`Deduct point from ${member.name}`}
                >
                  −
                </button>

                {/* Delta pill */}
                <span className={`w-12 text-center text-[13px] font-bold tabular-nums ${
                  delta > 0 ? 'text-green' : delta < 0 ? 'text-red' : 'text-[#969696]'
                }`}>
                  {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '—'}
                </span>

                {/* + */}
                <button
                  type="button"
                  onClick={() => setDelta(member.id, delta + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#DEDEDE] text-[#5A5A5A] hover:border-green/40 hover:text-green transition-colors text-[16px]"
                  aria-label={`Award point to ${member.name}`}
                >
                  +
                </button>

                {/* Apply */}
                <button
                  type="button"
                  onClick={() => applyScore(member.id)}
                  disabled={!pending || scoreSaving === member.id}
                  className={`ml-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest transition-all ${
                    pending
                      ? 'bg-primary text-white hover:bg-primary/80'
                      : 'bg-[#F7F7F7] text-[#969696] cursor-not-allowed'
                  }`}
                >
                  {scoreSaving === member.id ? '…' : 'Apply'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SaveIndicator({ saving, saved, error }: { saving: boolean; saved: boolean; error: boolean }) {
  if (!saving && !saved && !error) return null
  return (
    <div className={`fixed bottom-6 right-8 z-10 rounded-full px-4 py-2 text-[12px] shadow-md ${error ? 'bg-red text-white' : 'bg-[#262626] text-white'}`}>
      {saving ? 'Saving…' : error ? 'Save failed' : 'Saved ✓'}
    </div>
  )
}
