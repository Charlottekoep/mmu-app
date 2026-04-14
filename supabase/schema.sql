-- ============================================================
-- MMU (Monday Mission Update) — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── Tables ──────────────────────────────────────────────────────────────

CREATE TABLE team_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  role       text        NOT NULL,
  department text        NOT NULL,
  photo_url  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mmu_sessions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number  integer     NOT NULL,
  date            date        NOT NULL,
  welcome_message text,
  created_by      text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE levers (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text    NOT NULL,
  focus_area    text    NOT NULL CHECK (focus_area IN (
                          'north_star',
                          'grow_client_base',
                          'increase_client_value',
                          'returns_to_scale',
                          'enablers'
                        )),
  sub_objective text,
  measure       text    NOT NULL,
  current_state text    NOT NULL,
  target        text    NOT NULL,
  owner         text    NOT NULL,
  rag_status    text    NOT NULL CHECK (rag_status IN ('green', 'amber', 'red')),
  trend         text             CHECK (trend      IN ('up', 'down', 'flat')),
  notes         text,
  display_order integer NOT NULL
);

CREATE TABLE lever_snapshots (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     uuid        NOT NULL REFERENCES mmu_sessions (id) ON DELETE CASCADE,
  lever_id       uuid        NOT NULL REFERENCES levers       (id) ON DELETE CASCADE,
  current_state  text        NOT NULL,
  rag_status     text        NOT NULL CHECK (rag_status IN ('green', 'amber', 'red')),
  trend          text                 CHECK (trend      IN ('up', 'down', 'flat')),
  notes          text,
  snapshotted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE session_sections (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid        NOT NULL REFERENCES mmu_sessions (id) ON DELETE CASCADE,
  section_type  text        NOT NULL CHECK (section_type IN (
                              'just_humans',
                              'north_star',
                              'deep_dive',
                              'show_and_tell',
                              'announcements',
                              'the_league'
                            )),
  is_active     boolean     NOT NULL DEFAULT true,
  display_order integer     NOT NULL,
  content       jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE leaderboard_entries (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid        NOT NULL REFERENCES team_members (id) ON DELETE CASCADE,
  score          integer     NOT NULL DEFAULT 0,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX ON lever_snapshots  (session_id);
CREATE INDEX ON lever_snapshots  (lever_id);
CREATE INDEX ON session_sections (session_id);
CREATE INDEX ON leaderboard_entries (team_member_id);
CREATE UNIQUE INDEX ON leaderboard_entries (team_member_id); -- one row per person

-- ─── Seed: Team Members ──────────────────────────────────────────────────
-- Using fixed UUIDs so we can reference them in leaderboard_entries below.
-- Role and department are left blank pending profile setup.

INSERT INTO team_members (id, name, role, department) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Ashton',       '', ''),
  ('00000000-0000-0000-0000-000000000002', 'Banele',       '', ''),
  ('00000000-0000-0000-0000-000000000003', 'Barry',        '', ''),
  ('00000000-0000-0000-0000-000000000004', 'Brendan',      '', ''),
  ('00000000-0000-0000-0000-000000000005', 'Cam',           '', ''),
  ('00000000-0000-0000-0000-000000000006', 'Charlotte',    '', ''),
  ('00000000-0000-0000-0000-000000000007', 'Cheryl',       '', ''),
  ('00000000-0000-0000-0000-000000000008', 'Daniel',       '', ''),
  ('00000000-0000-0000-0000-000000000009', 'Dionne',       '', ''),
  ('00000000-0000-0000-0000-000000000010', 'Dylan',        '', ''),
  ('00000000-0000-0000-0000-000000000011', 'Franck',       '', ''),
  ('00000000-0000-0000-0000-000000000012', 'Gordon',       '', ''),
  ('00000000-0000-0000-0000-000000000013', 'Jared',        '', ''),
  ('00000000-0000-0000-0000-000000000014', 'J''Mari',      '', ''),
  ('00000000-0000-0000-0000-000000000015', 'Jenni',        '', ''),
  ('00000000-0000-0000-0000-000000000016', 'Jonny',        '', ''),
  ('00000000-0000-0000-0000-000000000044', 'Jono',          '', ''),
  ('00000000-0000-0000-0000-000000000017', 'Jordan',       '', ''),
  ('00000000-0000-0000-0000-000000000018', 'Josh',         '', ''),
  ('00000000-0000-0000-0000-000000000019', 'Keandra',      '', ''),
  ('00000000-0000-0000-0000-000000000020', 'Lindsay',      '', ''),
  ('00000000-0000-0000-0000-000000000021', 'Lourens',      '', ''),
  ('00000000-0000-0000-0000-000000000045', 'Louw',          '', ''),
  ('00000000-0000-0000-0000-000000000022', 'Marcel',       '', ''),
  ('00000000-0000-0000-0000-000000000023', 'Memona',       '', ''),
  ('00000000-0000-0000-0000-000000000024', 'Nadia',        '', ''),
  ('00000000-0000-0000-0000-000000000025', 'Nic',          '', ''),
  ('00000000-0000-0000-0000-000000000026', 'Nkosi',        '', ''),
  ('00000000-0000-0000-0000-000000000027', 'Olly',          '', ''),
  ('00000000-0000-0000-0000-000000000028', 'Rail',         '', ''),
  ('00000000-0000-0000-0000-000000000029', 'Reece',        '', ''),
  ('00000000-0000-0000-0000-000000000030', 'Reinet',       '', ''),
  ('00000000-0000-0000-0000-000000000031', 'Rob',          '', ''),
  ('00000000-0000-0000-0000-000000000032', 'Ruth',         '', ''),
  ('00000000-0000-0000-0000-000000000033', 'Ryan F',        '', ''),
  ('00000000-0000-0000-0000-000000000043', 'Ryan P',        '', ''),
  ('00000000-0000-0000-0000-000000000034', 'Shannon',      '', ''),
  ('00000000-0000-0000-0000-000000000035', 'Simoné',       '', ''),
  ('00000000-0000-0000-0000-000000000036', 'Sizwe',        '', ''),
  ('00000000-0000-0000-0000-000000000037', 'Steph',        '', ''),
  ('00000000-0000-0000-0000-000000000038', 'Tabitha',      '', ''),
  ('00000000-0000-0000-0000-000000000039', 'Tebogo',       '', ''),
  ('00000000-0000-0000-0000-000000000040', 'Thayer',       '', ''),
  ('00000000-0000-0000-0000-000000000041', 'Tsundzukani',  '', ''),
  ('00000000-0000-0000-0000-000000000042', 'Wardah',       '', '');

-- ─── Seed: Leaderboard Entries ───────────────────────────────────────────

INSERT INTO leaderboard_entries (team_member_id, score) VALUES
  ('00000000-0000-0000-0000-000000000001', 0),
  ('00000000-0000-0000-0000-000000000002', 0),
  ('00000000-0000-0000-0000-000000000003', 0),
  ('00000000-0000-0000-0000-000000000004', 0),
  ('00000000-0000-0000-0000-000000000005', 0),
  ('00000000-0000-0000-0000-000000000006', 0),
  ('00000000-0000-0000-0000-000000000007', 0),
  ('00000000-0000-0000-0000-000000000008', 0),
  ('00000000-0000-0000-0000-000000000009', 0),
  ('00000000-0000-0000-0000-000000000010', 0),
  ('00000000-0000-0000-0000-000000000011', 0),
  ('00000000-0000-0000-0000-000000000012', 0),
  ('00000000-0000-0000-0000-000000000013', 0),
  ('00000000-0000-0000-0000-000000000014', 0),
  ('00000000-0000-0000-0000-000000000015', 0),
  ('00000000-0000-0000-0000-000000000016', 0),
  ('00000000-0000-0000-0000-000000000017', 0),
  ('00000000-0000-0000-0000-000000000018', 0),
  ('00000000-0000-0000-0000-000000000019', 0),
  ('00000000-0000-0000-0000-000000000020', 0),
  ('00000000-0000-0000-0000-000000000021', 0),
  ('00000000-0000-0000-0000-000000000022', 0),
  ('00000000-0000-0000-0000-000000000023', 0),
  ('00000000-0000-0000-0000-000000000024', 0),
  ('00000000-0000-0000-0000-000000000025', 0),
  ('00000000-0000-0000-0000-000000000026', 0),
  ('00000000-0000-0000-0000-000000000027', 0),
  ('00000000-0000-0000-0000-000000000028', 0),
  ('00000000-0000-0000-0000-000000000029', 0),
  ('00000000-0000-0000-0000-000000000030', 0),
  ('00000000-0000-0000-0000-000000000031', 0),
  ('00000000-0000-0000-0000-000000000032', 0),
  ('00000000-0000-0000-0000-000000000033', 0),
  ('00000000-0000-0000-0000-000000000034', 0),
  ('00000000-0000-0000-0000-000000000035', 0),
  ('00000000-0000-0000-0000-000000000036', 0),
  ('00000000-0000-0000-0000-000000000037', 0),
  ('00000000-0000-0000-0000-000000000038', 0),
  ('00000000-0000-0000-0000-000000000039', 0),
  ('00000000-0000-0000-0000-000000000040', 0),
  ('00000000-0000-0000-0000-000000000041', 0),
  ('00000000-0000-0000-0000-000000000042', 0),
  ('00000000-0000-0000-0000-000000000043', 0),
  ('00000000-0000-0000-0000-000000000044', 0),
  ('00000000-0000-0000-0000-000000000045', 0);

-- ─── Seed: Levers ────────────────────────────────────────────────────────

INSERT INTO levers (name, focus_area, measure, current_state, target, owner, rag_status, display_order) VALUES

  -- ── North Star ──────────────────────────────────────────────────────
  ('Operate profitably',
    'north_star', 'EBITDA profitable month-to-month',
    'No', 'Yes', 'Charlotte', 'amber', 1),

  ('Grow consistently',
    'north_star', 'YoY ARR growth rate',
    '55%', '>70%', 'Charlotte', 'amber', 2),

  ('Maintain SaaS gross margin',
    'north_star', 'Platform gross profit margin',
    '70%', '75%', 'Charlotte', 'amber', 3),

  ('Run a self-sustaining services business',
    'north_star', 'Services gross profit margin',
    '30%', '>20%', 'Charlotte', 'green', 4),

  ('Do more with less',
    'north_star', 'ARR per head',
    '$89,048', '$200,000', 'Charlotte', 'red', 5),

  ('Earn hard currency',
    'north_star', 'Non-ZAR ARR as % of total',
    '17%', '>50%', 'Charlotte', 'red', 6),

  -- ── Grow Client Base ────────────────────────────────────────────────
  ('Grow the pipeline',
    'grow_client_base', '4x qualified pipeline coverage',
    '$2.67m', '$8m', 'Barry', 'red', 7),

  ('Close the pipeline',
    'grow_client_base', 'Win rate on qualified opportunities',
    'WIP', '25%', 'Barry', 'amber', 8),

  ('Be the leading brand',
    'grow_client_base', 'Share of Voice',
    '5.58%', '40%', 'Jared', 'red', 9),

  -- ── Increase Client Value ────────────────────────────────────────────
  ('Accelerate product momentum',
    'increase_client_value', '% time on R&D (rolling 3mo avg)',
    '42%', '75%', 'Nic', 'red', 10),

  ('Meet market needs',
    'increase_client_value', '% clients using ≥80% core domains (forward-looking)',
    'tbd', '90%', 'Nic', 'amber', 11),

  ('Delight users',
    'increase_client_value', 'Bi-annual CSAT score',
    '83.9%', '>78%', 'Nic', 'green', 12),

  ('Exceed expectations',
    'increase_client_value', 'Decision-maker NPS',
    '7', '≥9', 'Lourens', 'amber', 13),

  ('Maximise platform adoption',
    'increase_client_value', '% clients using ≥80% core domains',
    'tbd', '90%', 'Lourens', 'amber', 14),

  ('Support CSAT',
    'increase_client_value', 'Average Support CSAT',
    '96%', '≥90%', 'Lourens', 'green', 15),

  ('Projects CSAT',
    'increase_client_value', 'Average Projects CSAT',
    '78.6%', '≥90%', 'Lourens', 'amber', 16),

  ('Clients grow with Root',
    'increase_client_value', 'Median annual GWP growth rate',
    '44%', '≥50%', 'Lourens', 'green', 17),

  -- ── Returns to Scale ────────────────────────────────────────────────
  ('Platform performance',
    'returns_to_scale', '% clients with <1s sync latency, no spike incidents',
    'tbd', '90%', 'Nic', 'amber', 18),

  ('Incidents are the exception',
    'returns_to_scale', 'P1&P2 incidents / main merges',
    'tbd', '0.1%', 'Nic', 'amber', 19),

  ('Hosting efficiency',
    'returns_to_scale', 'Hosting cost per 1,000 active policies',
    '$6.40', '$2.08', 'Nic', 'red', 20),

  ('Never compromise security',
    'returns_to_scale', '100% live controls, 0 overdue critical risks',
    '0%', '100%', 'Nic', 'red', 21),

  ('Deliver first value fast',
    'returns_to_scale', 'Median time to live, last 12mo',
    '148 days', '100 days', 'Lourens', 'red', 22),

  ('Rapid parallel delivery',
    'returns_to_scale', 'Concurrent project throughput',
    '11', '14', 'Lourens', 'amber', 23),

  ('Friction in product build',
    'returns_to_scale', 'Builder satisfaction measure',
    'tbd', 'tbd', 'Nic', 'amber', 24),

  -- ── Enablers ────────────────────────────────────────────────────────
  ('Drive employee satisfaction',
    'enablers', 'Root eNPS',
    '8.44', '9', 'Jonny', 'amber', 25),

  ('Hire the best',
    'enablers', 'Employee retention rate',
    '77%', '80%', 'Jonny', 'amber', 26),

  ('Nurture a client-first culture',
    'enablers', 'Client section in Employee Engagement Survey',
    '-%', '5', 'Charlotte', 'amber', 27),

  ('Grow our knowledge base',
    'enablers', 'Ease of access to information',
    'tbd', 'tbd', 'Jonny', 'amber', 28),

  ('Easy data access',
    'enablers', '% clients using Root data',
    'tbd', '100%', 'Nic', 'amber', 29),

  ('Data trust',
    'enablers', 'Data quality record coverage',
    '0%', '100%', 'Nic', 'red', 30);
