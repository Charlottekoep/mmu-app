import TeamAvatar from '@/components/TeamAvatar'
import type { TeamMember } from '@/lib/types'

type Props = {
  presenter:   TeamMember
  presenter2?: TeamMember
}

export default function PresenterBadge({ presenter, presenter2 }: Props) {
  if (presenter2) {
    return (
      <div className="flex flex-shrink-0 gap-3">
        <PersonCard member={presenter} />
        <PersonCard member={presenter2} />
      </div>
    )
  }

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

function PersonCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex flex-shrink-0 flex-col items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 text-center min-w-[120px]">
      <TeamAvatar member={member} size={56} className="border-2 border-white/15" />
      <div>
        <p className="type-eyebrow text-white/35 mb-1">Presented by</p>
        <p className="text-[14px] font-bold text-white leading-tight">{member.name}</p>
        {member.role && (
          <p className="mt-0.5 type-eyebrow" style={{ color: '#2969FF' }}>{member.role}</p>
        )}
      </div>
    </div>
  )
}
