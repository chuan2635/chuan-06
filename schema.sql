-- ============================================================
-- YC Studio AI Workspace — Supabase Schema
-- 請在 Supabase SQL Editor 貼上並執行
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── AI 部門 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_departments (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace   TEXT        NOT NULL DEFAULT 'main',
  name        TEXT        NOT NULL,
  description TEXT,
  color       TEXT        NOT NULL DEFAULT '#C9924F',
  icon        TEXT        NOT NULL DEFAULT '🏢',
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── AI 員工 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_agents (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace       TEXT        NOT NULL DEFAULT 'main',
  department_id   UUID        REFERENCES ai_departments(id) ON DELETE SET NULL,
  name            TEXT        NOT NULL,
  role            TEXT        NOT NULL,
  avatar          TEXT        DEFAULT '🤖',
  system_prompt   TEXT        NOT NULL DEFAULT '',
  model           TEXT        NOT NULL DEFAULT 'gemini-2.0-flash',
  tools_allowed   JSONB       NOT NULL DEFAULT '[]',
  status          TEXT        NOT NULL DEFAULT 'idle'
                  CHECK (status IN ('idle','running','error','offline')),
  last_run_at     TIMESTAMPTZ,
  last_error      TEXT,
  config          JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 執行日誌 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_runs (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id      UUID        NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  workspace     TEXT        NOT NULL DEFAULT 'main',
  trigger_type  TEXT        NOT NULL DEFAULT 'manual',
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','running','done','error')),
  input         JSONB       DEFAULT '{}',
  output        JSONB       DEFAULT '{}',
  tool_calls    JSONB       DEFAULT '[]',
  tokens_used   INT         DEFAULT 0,
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_runs_agent_id ON agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS agent_runs_workspace ON agent_runs(workspace, created_at DESC);

-- ── 待辦清單 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS todo_lists (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace   TEXT        NOT NULL DEFAULT 'main',
  name        TEXT        NOT NULL,
  icon        TEXT        DEFAULT '📋',
  color       TEXT        DEFAULT '#C9924F',
  is_system   BOOLEAN     NOT NULL DEFAULT FALSE,
  system_key  TEXT,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO todo_lists (id, workspace, name, icon, is_system, system_key, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'main', '收件匣', '📥', TRUE, 'inbox', 0),
  ('00000000-0000-0000-0000-000000000002', 'main', '今天',   '🌅', TRUE, 'today', 1),
  ('00000000-0000-0000-0000-000000000003', 'main', '某天',   '🌙', TRUE, 'someday', 2)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS todos (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace     TEXT        NOT NULL DEFAULT 'main',
  list_id       UUID        REFERENCES todo_lists(id) ON DELETE SET NULL,
  parent_id     UUID        REFERENCES todos(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  notes         TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','done','cancelled')),
  priority      TEXT        NOT NULL DEFAULT 'mid'
                CHECK (priority IN ('urgent','high','mid','low')),
  due_date      DATE,
  tags          TEXT[]      NOT NULL DEFAULT '{}',
  created_by    TEXT        NOT NULL DEFAULT 'human',
  completed_at  TIMESTAMPTZ,
  sort_order    FLOAT       NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS todos_workspace ON todos(workspace, status);
CREATE INDEX IF NOT EXISTS todos_list_id   ON todos(list_id);
CREATE INDEX IF NOT EXISTS todos_parent_id ON todos(parent_id);
CREATE INDEX IF NOT EXISTS todos_due_date  ON todos(due_date);

-- ── 筆記本 ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notebooks (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace   TEXT        NOT NULL DEFAULT 'main',
  name        TEXT        NOT NULL,
  icon        TEXT        DEFAULT '📓',
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace     TEXT        NOT NULL DEFAULT 'main',
  notebook_id   UUID        REFERENCES notebooks(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL DEFAULT '未命名筆記',
  content       TEXT        NOT NULL DEFAULT '',
  tags          TEXT[]      NOT NULL DEFAULT '{}',
  is_pinned     BOOLEAN     NOT NULL DEFAULT FALSE,
  is_quick_note BOOLEAN     NOT NULL DEFAULT FALSE,
  created_by    TEXT        NOT NULL DEFAULT 'human',
  word_count    INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_workspace  ON notes(workspace);
CREATE INDEX IF NOT EXISTS notes_notebook   ON notes(notebook_id);
CREATE INDEX IF NOT EXISTS notes_quick      ON notes(workspace, is_quick_note);

-- ── 卡片集合 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS card_collections (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace       TEXT        NOT NULL DEFAULT 'main',
  name            TEXT        NOT NULL,
  description     TEXT,
  icon            TEXT        DEFAULT '🗂',
  field_schema    JSONB       NOT NULL DEFAULT '[]',
  default_view    TEXT        NOT NULL DEFAULT 'table',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cards (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace       TEXT        NOT NULL DEFAULT 'main',
  collection_id   UUID        NOT NULL REFERENCES card_collections(id) ON DELETE CASCADE,
  fields          JSONB       NOT NULL DEFAULT '{}',
  created_by      TEXT        NOT NULL DEFAULT 'human',
  sort_order      FLOAT       NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cards_collection ON cards(collection_id);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE ai_departments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_lists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards            ENABLE ROW LEVEL SECURITY;

CREATE POLICY ws_ai_dept   ON ai_departments   FOR ALL USING (workspace = 'main');
CREATE POLICY ws_ai_agent  ON ai_agents        FOR ALL USING (workspace = 'main');
CREATE POLICY ws_run       ON agent_runs       FOR ALL USING (workspace = 'main');
CREATE POLICY ws_tlist     ON todo_lists       FOR ALL USING (workspace = 'main');
CREATE POLICY ws_todo      ON todos            FOR ALL USING (workspace = 'main');
CREATE POLICY ws_notebook  ON notebooks        FOR ALL USING (workspace = 'main');
CREATE POLICY ws_note      ON notes            FOR ALL USING (workspace = 'main');
CREATE POLICY ws_coll      ON card_collections FOR ALL USING (workspace = 'main');
CREATE POLICY ws_card      ON cards            FOR ALL USING (workspace = 'main');
