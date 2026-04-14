import Link from 'next/link'
import { getServerClient } from '@/lib/supabase'
import DarkPageLayout from '@/components/DarkPageLayout'
import StartSessionButton from '@/components/StartSessionButton'
import type { MmuSession } from '@/lib/types'

function formatSessionTitle(isoDate: string) {
  // "MMU 20 April 2026"
  return 'MMU ' + new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  })
}

export default async function HomePage() {
  const supabase = getServerClient()
  const { data } = await supabase
    .from('mmu_sessions')
    .select('*')
    .order('date', { ascending: false })
    .limit(10)

  const sessions: MmuSession[] = data ?? []

  return (
    <DarkPageLayout>
      <div className="flex min-h-screen flex-col items-center justify-center px-8 py-20 relative">
        {/* Root logo — top left */}
        <div className="absolute top-8 left-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/RootLogo-RGB-FullColWhtxt.svg" alt="Root" className="h-8 w-auto" />
        </div>

        {/* ── Branding ─────────────────────────────────────────────────── */}
        <div className="mb-14 text-center">
          <p className="type-eyebrow text-white">Root Insurance</p>
          <h1 className="mt-4 type-display text-white leading-none">MMU</h1>
          <p className="mt-3 type-body-large text-white/65">Monday Mission Update</p>
        </div>

        {/* ── Primary CTA ──────────────────────────────────────────────── */}
        <StartSessionButton />

        {/* ── Recent sessions ──────────────────────────────────────────── */}
        {sessions.length > 0 && (
          <div className="mt-16 w-full max-w-md">
            <p className="type-eyebrow text-white mb-4">Recent sessions</p>
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/presentation/${s.id}`}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-4 transition-colors hover:bg-white/10"
                  >
                    <div>
                      <p className="text-[17px] leading-snug text-white">
                        {formatSessionTitle(s.date)}
                      </p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="shrink-0 text-white/30"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 3L11 8L6 13"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sessions.length === 0 && (
          <p className="mt-12 type-eyebrow text-white/65">
            No sessions yet — create your first one above
          </p>
        )}
      </div>
    </DarkPageLayout>
  )
}
