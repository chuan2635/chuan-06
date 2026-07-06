-- CubeLV App - Supabase Database Schema
-- Phase 1: Initial tables setup
-- Execute this script in Supabase SQL Editor

-- ============================================
-- 1. FOLDERS TABLE (Workspace/Folders)
-- ============================================
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'folder', -- 'workspace' | 'folder'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for faster queries
  CONSTRAINT valid_type CHECK (type IN ('workspace', 'folder'))
);

CREATE INDEX idx_folders_owner_id ON folders(owner_id);
CREATE INDEX idx_folders_created_at ON folders(created_at DESC);

-- RLS Policy for folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own folders"
  ON folders FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================
-- 2. AGENTS TABLE (AI Employees)
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instructions TEXT NOT NULL,
  ai_model TEXT DEFAULT 'claude-sonnet-4-6',
  max_rounds INTEGER DEFAULT 50 CHECK (max_rounds > 0 AND max_rounds <= 100),
  schedule_cron TEXT, -- e.g., "0 15 * * 5" for Friday 15:30
  notifications_enabled BOOLEAN DEFAULT true,
  avatar_icon TEXT, -- emoji or icon identifier
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_ai_model CHECK (ai_model IN ('Auto', 'claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5'))
);

CREATE INDEX idx_agents_folder_id ON agents(folder_id);
CREATE INDEX idx_agents_created_at ON agents(created_at DESC);

-- RLS Policy for agents (inherited from folders)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agents in their folders"
  ON agents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = agents.folder_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create agents in their folders"
  ON agents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = agents.folder_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update agents in their folders"
  ON agents FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = agents.folder_id AND folders.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = agents.folder_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete agents in their folders"
  ON agents FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = agents.folder_id AND folders.owner_id = auth.uid()
  ));

-- ============================================
-- 3. AGENT MEMORIES TABLE (Long-term Memory)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT DEFAULT '', -- Markdown format
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent memories"
  ON agent_memories FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agents
    JOIN folders ON agents.folder_id = folders.id
    WHERE agents.id = agent_memories.agent_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update agent memories"
  ON agent_memories FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM agents
    JOIN folders ON agents.folder_id = folders.id
    WHERE agents.id = agent_memories.agent_id AND folders.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM agents
    JOIN folders ON agents.folder_id = folders.id
    WHERE agents.id = agent_memories.agent_id AND folders.owner_id = auth.uid()
  ));

-- ============================================
-- 4. AGENT SKILLS TABLE (Tool Configuration)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one agent can only have one of each skill type
  UNIQUE(agent_id, skill_type),

  CONSTRAINT valid_skill_type CHECK (skill_type IN (
    'read_folder', 'create_note', 'update_note', 'delete_note',
    'create_todo', 'update_todo', 'delete_todo',
    'create_chart', 'update_chart', 'delete_chart',
    'web_search', 'fetch_stock_data'
  ))
);

CREATE INDEX idx_agent_skills_agent_id ON agent_skills(agent_id);

ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent skills"
  ON agent_skills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agents
    JOIN folders ON agents.folder_id = folders.id
    WHERE agents.id = agent_skills.agent_id AND folders.owner_id = auth.uid()
  ));

-- ============================================
-- 5. AGENT BUDGETS TABLE (Cost Control)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
  monthly_limit INTEGER DEFAULT 0, -- 0 = unlimited
  credits_used INTEGER DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_credits CHECK (credits_used >= 0)
);

ALTER TABLE agent_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budgets"
  ON agent_budgets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agents
    JOIN folders ON agents.folder_id = folders.id
    WHERE agents.id = agent_budgets.agent_id AND folders.owner_id = auth.uid()
  ));

-- ============================================
-- 6. EXECUTION LOGS TABLE (Run History)
-- ============================================
CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  triggered_by TEXT NOT NULL, -- 'manual' | 'schedule' | 'chat'
  status TEXT NOT NULL DEFAULT 'running', -- 'running' | 'success' | 'cancelled' | 'failed'
  duration_seconds INTEGER,
  tokens_used INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  output_summary TEXT, -- JSON summary of what was created/updated

  CONSTRAINT valid_triggered_by CHECK (triggered_by IN ('manual', 'schedule', 'chat')),
  CONSTRAINT valid_status CHECK (status IN ('running', 'success', 'cancelled', 'failed')),
  CONSTRAINT valid_tokens CHECK (tokens_used >= 0),
  CONSTRAINT valid_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

CREATE INDEX idx_execution_logs_agent_id ON execution_logs(agent_id);
CREATE INDEX idx_execution_logs_started_at ON execution_logs(started_at DESC);
CREATE INDEX idx_execution_logs_status ON execution_logs(status);

ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view execution logs"
  ON execution_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agents
    JOIN folders ON agents.folder_id = folders.id
    WHERE agents.id = execution_logs.agent_id AND folders.owner_id = auth.uid()
  ));

-- ============================================
-- 7. NOTES TABLE (Markdown Notes)
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '', -- Markdown format
  created_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}', -- Array of tags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_is_favorite ON notes(is_favorite);
CREATE INDEX idx_notes_created_by_agent_id ON notes(created_by_agent_id);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes in their folders"
  ON notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = notes.folder_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create notes in their folders"
  ON notes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = notes.folder_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update notes in their folders"
  ON notes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = notes.folder_id AND folders.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = notes.folder_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete notes in their folders"
  ON notes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = notes.folder_id AND folders.owner_id = auth.uid()
  ));

-- ============================================
-- 8. TODOS TABLE (Task Management)
-- ============================================
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES todos(id) ON DELETE CASCADE, -- For sub-todos
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium', -- 'low' | 'medium' | 'high'
  assigned_to_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  due_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high'))
);

CREATE INDEX idx_todos_folder_id ON todos(folder_id);
CREATE INDEX idx_todos_parent_id ON todos(parent_id);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_due_at ON todos(due_at);
CREATE INDEX idx_todos_assigned_to_agent_id ON todos(assigned_to_agent_id);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view todos in their folders"
  ON todos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = todos.folder_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create todos in their folders"
  ON todos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = todos.folder_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update todos in their folders"
  ON todos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = todos.folder_id AND folders.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = todos.folder_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete todos in their folders"
  ON todos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = todos.folder_id AND folders.owner_id = auth.uid()
  ));

-- ============================================
-- 9. CHARTS TABLE (Data Visualization)
-- ============================================
CREATE TABLE IF NOT EXISTS charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  chart_type TEXT NOT NULL, -- 'line' | 'bar' | 'pie' | 'area'
  data JSONB NOT NULL DEFAULT '{}', -- Recharts-compatible format
  created_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_chart_type CHECK (chart_type IN ('line', 'bar', 'pie', 'area', 'scatter'))
);

CREATE INDEX idx_charts_folder_id ON charts(folder_id);
CREATE INDEX idx_charts_created_at ON charts(created_at DESC);
CREATE INDEX idx_charts_created_by_agent_id ON charts(created_by_agent_id);

ALTER TABLE charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view charts in their folders"
  ON charts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = charts.folder_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create charts in their folders"
  ON charts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = charts.folder_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update charts in their folders"
  ON charts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = charts.folder_id AND folders.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = charts.folder_id AND folders.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete charts in their folders"
  ON charts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM folders WHERE folders.id = charts.folder_id AND folders.owner_id = auth.uid()
  ));

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary:
-- ✓ 9 tables created (folders, agents, memories, skills, budgets, logs, notes, todos, charts)
-- ✓ Foreign key relationships established
-- ✓ Indexes created for performance
-- ✓ RLS (Row Level Security) policies configured
-- ✓ Data constraints and checks added
--
-- Next steps:
-- 1. Test table creation in Supabase
-- 2. Create TypeScript types from schema
-- 3. Build API layer for CRUD operations
-- 4. Implement UI components
