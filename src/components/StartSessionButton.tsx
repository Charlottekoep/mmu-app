'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSession } from '@/lib/create-session'

type Props = { isAdmin: boolean }

export default function StartSessionButton({ isAdmin }: Props) {
  const router              = useRouter()
  const [busy,  setBusy]    = useState(false)
  const [error, setError]   = useState<string | null>(null)

  if (!isAdmin) return null

  async function handleCreate() {
    setBusy(true)
    setError(null)

    const result = await createSession()

    if (!result.id) {
      setError(result.error ?? 'Failed to create session — please try again.')
      setBusy(false)
      return
    }

    router.push(`/edit/${result.id}`)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleCreate}
        disabled={busy}
        className="rounded-2xl bg-primary px-10 py-5 type-h3 text-white shadow-elevated transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? 'Creating…' : 'Create new MMU'}
      </button>
      {error && (
        <p className="text-[13px] text-red/80">{error}</p>
      )}
    </div>
  )
}
