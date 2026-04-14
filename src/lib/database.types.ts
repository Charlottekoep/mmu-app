import type { RagStatus, SectionType } from './types'

type Trend = 'up' | 'down' | 'flat'

// Minimal Supabase Database generic type for MMU.
// Each table must include Relationships (even if empty []) to satisfy
// GenericTable, which is required for SupabaseClient's Schema conditional.

export type Database = {
  public: {
    Tables: {
      team_members: {
        Row: {
          id:         string
          name:       string
          role:       string
          department: string
          photo_url:  string | null
          created_at: string
        }
        Insert: {
          id?:         string
          name:        string
          role:        string
          department:  string
          photo_url?:  string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['team_members']['Row']>
        Relationships: []
      }
      mmu_sessions: {
        Row: {
          id:              string
          session_number:  number
          date:            string
          welcome_message: string | null
          created_by:      string
          created_at:      string
        }
        Insert: {
          id?:              string
          session_number:   number
          date:             string
          welcome_message?: string | null
          created_by:       string
          created_at?:      string
        }
        Update: Partial<Database['public']['Tables']['mmu_sessions']['Row']>
        Relationships: []
      }
      levers: {
        Row: {
          id:            string
          name:          string
          focus_area:    string
          sub_objective: string | null
          measure:       string
          current_state: string
          target:        string
          owner:         string
          rag_status:    RagStatus
          trend:         Trend | null
          notes:         string | null
          display_order: number
        }
        Insert: {
          id?:            string
          name:           string
          focus_area:     string
          sub_objective?: string | null
          measure:        string
          current_state:  string
          target:         string
          owner:          string
          rag_status:     string
          trend?:         string | null
          notes?:         string | null
          display_order:  number
        }
        Update: Partial<Database['public']['Tables']['levers']['Row']>
        Relationships: []
      }
      lever_snapshots: {
        Row: {
          id:              string
          session_id:      string
          lever_id:        string
          current_state:   string
          rag_status:      RagStatus
          trend:           Trend | null
          notes:           string | null
          done_update:     string | null
          planning_update: string | null
          images:          string[]
          snapshotted_at:  string
        }
        Insert: {
          id?:              string
          session_id:       string
          lever_id:         string
          current_state:    string
          rag_status:       RagStatus
          trend?:           Trend | null
          notes?:           string | null
          done_update?:     string | null
          planning_update?: string | null
          images?:          string[]
          snapshotted_at?:  string
        }
        Update: Partial<Database['public']['Tables']['lever_snapshots']['Row']>
        Relationships: [
          {
            foreignKeyName: 'lever_snapshots_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'mmu_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lever_snapshots_lever_id_fkey'
            columns: ['lever_id']
            isOneToOne: false
            referencedRelation: 'levers'
            referencedColumns: ['id']
          },
        ]
      }
      session_sections: {
        Row: {
          id:            string
          session_id:    string
          section_type:  SectionType
          is_active:     boolean
          display_order: number
          content:       Record<string, unknown>
          created_at:    string
        }
        Insert: {
          id?:            string
          session_id:     string
          section_type:   string
          is_active?:     boolean
          display_order:  number
          content?:       Record<string, unknown>
          created_at?:    string
        }
        Update: Partial<Database['public']['Tables']['session_sections']['Row']>
        Relationships: [
          {
            foreignKeyName: 'session_sections_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'mmu_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          id:             string
          team_member_id: string
          score:          number
          updated_at:     string
        }
        Insert: {
          id?:             string
          team_member_id:  string
          score?:          number
          updated_at?:     string
        }
        Update: Partial<Database['public']['Tables']['leaderboard_entries']['Row']>
        Relationships: [
          {
            foreignKeyName: 'leaderboard_entries_team_member_id_fkey'
            columns: ['team_member_id']
            isOneToOne: true
            referencedRelation: 'team_members'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views:     Record<string, never>
    Functions: Record<string, never>
    Enums:     Record<string, never>
  }
}
