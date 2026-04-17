'use client'

import { useState, useCallback, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import type { SessionSection, TeamMember } from '@/lib/types'
import RichTextEditor from '@/components/RichTextEditor'
import ImageUploader  from '@/components/ImageUploader'
import TeamAvatar     from '@/components/TeamAvatar'
import type { ImageItem } from '@/lib/types'
import { normaliseImages } from '@/lib/types'

// ─── Shared styles ────────────────────────────────────────────────────────

const fieldLabel = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls   = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'
const selectCls  = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] outline-none transition-colors focus:border-[#2969FF] appearance-none'

// ─── Types ────────────────────────────────────────────────────────────────

type QuizItem = { question: string; answer: string }

type LeaderboardRow = { name: string; score: number }

type Content = {
  presenter_id:    string
  presenter_id_2:  string
  concept:         string
  quiz:            QuizItem[]
  images:          ImageItem[]
  leaderboard_data: LeaderboardRow[]
}

type Props = {
  section:     SessionSection
  sessionId:   string
  teamMembers: TeamMember[]
}

// ─── Component ────────────────────────────────────────────────────────────

export default function TheLeagueForm({ section, sessionId, teamMembers }: Props) {
  const raw = section.content as Partial<Content>

  const [is_active,        setIsActive]        = useState(section.is_active)
  const [presenter_id,     setPresenter]        = useState(raw.presenter_id   ?? '')
  const [presenter_id_2,   setPresenter2]       = useState(raw.presenter_id_2 ?? '')
  const [concept,          setConcept]          = useState(raw.concept        ?? '')
  const [quiz,             setQuiz]             = useState<QuizItem[]>(
    (raw.quiz ?? []).length > 0 ? (raw.quiz as QuizItem[]) : [{ question: '', answer: '' }],
  )
  const [images,           setImages]           = useState<ImageItem[]>(
    normaliseImages((raw.images ?? []) as (string | ImageItem)[]),
  )
  const [leaderboard_data, setLeaderboardData]  = useState<LeaderboardRow[]>(raw.leaderboard_data ?? [])
  const [csvPreview,       setCsvPreview]       = useState<LeaderboardRow[] | null>(null)
  const [csvError,         setCsvError]         = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [saveError, setSaveError] = useState(false)

  const persist = useCallback(async (patch: Partial<Content & { is_active?: boolean }>) => {
    setSaving(true); setSaved(false); setSaveError(false)
    const content: Content = {
      presenter_id:     patch.presenter_id    ?? presenter_id,
      presenter_id_2:   patch.presenter_id_2  ?? presenter_id_2,
      concept:          patch.concept         ?? concept,
      quiz:             patch.quiz            ?? quiz,
      images:           patch.images          ?? images,
      leaderboard_data: patch.leaderboard_data ?? leaderboard_data,
    }
    const active = patch.is_active !== undefined ? patch.is_active : is_active
    const { error: err } = await getBrowserClient()
      .from('session_sections')
      .update({ content, is_active: active })
      .eq('id', section.id)
    if (err) { setSaving(false); setSaveError(true); setTimeout(() => setSaveError(false), 3000); return }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [presenter_id, presenter_id_2, concept, quiz, images, leaderboard_data, is_active, section.id])

  function toggleActive() {
    const next = !is_active
    setIsActive(next)
    persist({ is_active: next })
  }

  // Quiz helpers
  function addQuiz() { setQuiz((q) => [...q, { question: '', answer: '' }]) }
  function removeQuiz(i: number) {
    const next = quiz.filter((_, idx) => idx !== i)
    setQuiz(next); persist({ quiz: next })
  }

  // CSV parsing
  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    setCsvError(null)
    setCsvPreview(null)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? ''
      const rows = text.split(/\r?\n/).filter((r) => r.trim())
      const parsed: LeaderboardRow[] = []
      const startIndex = rows[0]?.toLowerCase().includes('name') ? 1 : 0
      for (let i = startIndex; i < rows.length; i++) {
        const [rawName, rawScore] = rows[i].split(',')
        const name  = rawName?.trim()
        const score = parseInt(rawScore?.trim() ?? '', 10)
        if (name && !isNaN(score)) parsed.push({ name, score })
      }
      if (parsed.length === 0) {
        setCsvError('No valid rows found. Expected columns: Name, Score')
        return
      }
      parsed.sort((a, b) => b.score - a.score)
      setCsvPreview(parsed)
    }
    reader.readAsText(file)
    // Reset so same file can be re-uploaded
    e.target.value = ''
  }

  function confirmCsvUpload() {
    if (!csvPreview) return
    setLeaderboardData(csvPreview)
    persist({ leaderboard_data: csvPreview })
    setCsvPreview(null)
  }

  function cancelCsvUpload() {
    setCsvPreview(null)
    setCsvError(null)
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

      {/* Presenters */}
      <div>
        <label className={fieldLabel}>Presenters</label>
        <div className="space-y-3">
          <div>
            <p className="text-[11px] text-[#969696] mb-1.5">Presenter 1</p>
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
          <div>
            <p className="text-[11px] text-[#969696] mb-1.5">Presenter 2 (optional)</p>
            <div className="flex items-center gap-3">
              <TeamAvatar member={teamMembers.find((m) => m.id === presenter_id_2)} size={36} className="border border-[#DEDEDE]" />
              <select
                value={presenter_id_2}
                onChange={(e) => { setPresenter2(e.target.value); persist({ presenter_id_2: e.target.value }) }}
                className={selectCls}
              >
                <option value="">— none —</option>
                {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
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
                placeholder="Answer (hidden until revealed in presentation)…"
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

      {/* Leaderboard CSV upload */}
      <div>
        <label className={fieldLabel}>Upload leaderboard (CSV)</label>
        <p className="mb-3 text-[12px] text-[#5A5A5A]">
          CSV must have two columns: <strong>Name</strong> and <strong>Score</strong>. Uploading replaces the current leaderboard for this session.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleCsvFile}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#2969FF]/40 bg-[#2969FF]/[0.04] px-5 py-3 text-[13px] font-medium text-[#2969FF] transition-all hover:bg-[#2969FF]/[0.08]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2v9M4 7l4-5 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Choose CSV file
        </label>

        {csvError && (
          <p className="mt-2 text-[12px] text-red">{csvError}</p>
        )}

        {/* Preview table */}
        {csvPreview && (
          <div className="mt-4 rounded-xl border border-[#DEDEDE] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#DEDEDE] flex items-center justify-between">
              <p className="text-[12px] font-semibold text-[#262626]">{csvPreview.length} rows imported — preview</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelCsvUpload}
                  className="rounded-full border border-[#DEDEDE] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#5A5A5A] hover:border-[#969696] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmCsvUpload}
                  className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-primary/80 transition-colors"
                >
                  Save leaderboard
                </button>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#F7F7F7]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-[#969696]">Rank</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-[#969696]">Name</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-widest text-[#969696]">Score</th>
                </tr>
              </thead>
              <tbody>
                {csvPreview.map((row, i) => (
                  <tr key={i} className="border-t border-[#F0F0F0]">
                    <td className="px-4 py-2.5 text-[13px] text-[#969696]">{i + 1}</td>
                    <td className="px-4 py-2.5 text-[13px] font-medium text-[#262626]">{row.name}</td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-bold text-[#262626] tabular-nums">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Current leaderboard summary */}
        {!csvPreview && leaderboard_data.length > 0 && (
          <div className="mt-3 rounded-xl border border-[#DEDEDE] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#DEDEDE]">
              <p className="text-[12px] font-semibold text-[#262626]">Current leaderboard · {leaderboard_data.length} entries</p>
            </div>
            <table className="w-full">
              <tbody>
                {leaderboard_data.slice(0, 5).map((row, i) => (
                  <tr key={i} className={i > 0 ? 'border-t border-[#F0F0F0]' : ''}>
                    <td className="px-4 py-2 text-[12px] text-[#969696] w-8">{i + 1}</td>
                    <td className="px-4 py-2 text-[12px] text-[#262626]">{row.name}</td>
                    <td className="px-4 py-2 text-right text-[12px] font-bold text-[#262626] tabular-nums">{row.score}</td>
                  </tr>
                ))}
                {leaderboard_data.length > 5 && (
                  <tr className="border-t border-[#F0F0F0]">
                    <td colSpan={3} className="px-4 py-2 text-[12px] text-[#969696] text-center">
                      +{leaderboard_data.length - 5} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
