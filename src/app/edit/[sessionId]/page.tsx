import { notFound } from 'next/navigation'
import { getServerClient } from '@/lib/supabase'
import EditShell from '@/components/EditShell'

export default async function EditPage({
  params,
  searchParams,
}: {
  params:       Promise<{ sessionId: string }>
  searchParams: Promise<{ section?: string }>
}) {
  const { sessionId }                    = await params
  const { section: initialSectionId }   = await searchParams
  const supabase = getServerClient()

  const [
    { data: session },
    { data: sections },
    { data: teamMembers },
    { data: levers },
    { data: snapshots },
    { data: leaderboard },
  ] = await Promise.all([
    supabase.from('mmu_sessions').select('*').eq('id', sessionId).single(),
    supabase
      .from('session_sections')
      .select('*')
      .eq('session_id', sessionId)
      .order('display_order'),
    supabase.from('team_members').select('*').order('name'),
    supabase.from('levers').select('*').order('display_order'),
    supabase.from('lever_snapshots').select('*').eq('session_id', sessionId),
    supabase.from('leaderboard_entries').select('*'),
  ])

  if (!session) notFound()

  return (
    <EditShell
      session={session}
      sections={sections ?? []}
      teamMembers={teamMembers ?? []}
      levers={levers ?? []}
      snapshots={snapshots ?? []}
      leaderboard={leaderboard ?? []}
      initialSectionId={initialSectionId}
    />
  )
}
