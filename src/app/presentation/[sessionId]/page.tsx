import { notFound } from 'next/navigation'
import { getServerClient } from '@/lib/supabase-server'
import PresentationShell from '@/components/PresentationShell'

export default async function PresentationPage({
  params,
  searchParams,
}: {
  params:       Promise<{ sessionId: string }>
  searchParams: Promise<{ section?: string }>
}) {
  const { sessionId }          = await params
  const { section: initialSectionId } = await searchParams
  const supabase = await getServerClient()

  const [{ data: session }, { data: sections }, { data: teamMembers }] = await Promise.all([
    supabase
      .from('mmu_sessions')
      .select('*')
      .eq('id', sessionId)
      .single(),
    supabase
      .from('session_sections')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('team_members')
      .select('*')
      .order('name'),
  ])

  if (!session) notFound()

  return (
    <PresentationShell
      session={session}
      sections={sections ?? []}
      teamMembers={teamMembers ?? []}
      initialSectionId={initialSectionId}
    />
  )
}
