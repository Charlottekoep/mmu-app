export type SectionType =
  | 'welcome'
  | 'just_humans'
  | 'north_star'
  | 'deep_dive'
  | 'show_and_tell'
  | 'announcements'
  | 'the_league'

export type RagStatus = 'green' | 'amber' | 'red'

export type MmuSession = {
  id:              string
  session_number:  number
  date:            string
  welcome_message: string | null
  created_by:      string
  created_at:      string
}

export type SessionSection = {
  id:            string
  session_id:    string
  section_type:  SectionType
  is_active:     boolean
  display_order: number
  content:       Record<string, unknown>
  created_at:    string
}

export type Lever = {
  id:            string
  name:          string
  focus_area:    string
  sub_objective: string | null
  measure:       string
  current_state: string
  target:        string
  owner:         string
  rag_status:    RagStatus
  trend:         'up' | 'down' | 'flat' | null
  notes:         string | null
  display_order: number
}

export type TeamMember = {
  id:         string
  name:       string
  role:       string
  department: string
  photo_url:  string | null
  created_at: string
}

export type LeaderboardEntry = {
  id:             string
  team_member_id: string
  score:          number
  updated_at:     string
}

export type LeverSnapshot = {
  id:              string
  session_id:      string
  lever_id:        string
  current_state:   string
  rag_status:      RagStatus
  trend:           'up' | 'down' | 'flat' | null
  notes:           string | null
  done_update:     string | null
  planning_update: string | null
  images:          string[]
  snapshotted_at:  string
}
