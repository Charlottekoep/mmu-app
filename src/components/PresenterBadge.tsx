import TeamAvatar from '@/components/TeamAvatar'
import type { TeamMember } from '@/lib/types'

export default function PresenterBadge({ presenter }: { presenter: TeamMember }) {
  return (
    <div className="flex flex-shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4">
      <TeamAvatar member={presenter} size={80} className="border-2 border-white/15" />
      <div>
        <p className="type-eyebrow text-white/35 mb-1.5">Presented by</p>
        <p className="text-[17px] font-bold text-white leading-tight">{presenter.name}</p>
        {presenter.role && (
          <p className="mt-1 type-eyebrow" style={{ color: '#2969FF' }}>{presenter.role}</p>
        )}
      </div>
    </div>
  )
}
