'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSession } from '@/lib/create-session'

export default function StartSessionButton() {
  const router              = useRouter()
  const [busy,  setBusy]    = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleCreate() {
    setBusy(true)
    setError(null)

    const sessionId = await createSession()

    if (!sessionId) {
      setError('Failed to create session — please try again.')
      setBusy(false)
      return
    }

    router.push(`/edit/${sessionId}`)
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
