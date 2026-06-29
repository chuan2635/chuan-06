-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Folders (工作區資料夾)
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('workspace', 'folder')),
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_folders_owner_id ON folders(owner_id);

-- Agents (AI 員工)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instructions TEXT NOT NULL,
  ai_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6' CHECK (ai_model IN ('Auto', 'claude-opus-4-8', 'claude-sonnet-4-6')),
  max_rounds INTEGER NOT NULL DEFAULT 50 CHECK (max_rounds > 0 AND max_rounds <= 100),
  schedule_cron TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  avatar_icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agents_folder_id ON agents(folder_id);

-- Agent Memory (長期記憶)
CREATE TABLE agent_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent Skills (技能配置)
CREATE TABLE agent_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_skills_agent_id ON agent_skills(agent_id);

-- Agent Budget (預算管控)
CREATE TABLE agent_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
  monthly_limit INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  period_end TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Execution Logs (執行紀錄)
CREATE TABLE execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('manual', 'schedule', 'chat')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'cancelled', 'failed')),
  duration_seconds INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_execution_logs_agent_id ON execution_logs(agent_id);
CREATE INDEX idx_execution_logs_started_at ON execution_logs(started_at);

-- Notes (筆記)
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_notes_created_by_agent_id ON notes(created_by_agent_id);

-- Todos (待辦事項)
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  assigned_to_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  due_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_todos_folder_id ON todos(folder_id);
CREATE INDEX idx_todos_parent_id ON todos(parent_id);
CREATE INDEX idx_todos_assigned_to_agent_id ON todos(assigned_to_agent_id);

-- Charts (圖表)
CREATE TABLE charts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  chart_type TEXT NOT NULL CHECK (chart_type IN ('line', 'bar', 'pie', 'scatter', 'area')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_charts_folder_id ON charts(folder_id);
CREATE INDEX idx_charts_created_by_agent_id ON charts(created_by_agent_id);

-- RLS Policies (Row Level Security)
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE charts ENABLE ROW LEVEL SECURITY;

-- RLS: Folders - Users can only access their own folders
CREATE POLICY "Users can read own folders"
  ON folders FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS: Agents - Access through folder ownership
CREATE POLICY "Users can read agents in their folders"
  ON agents FOR SELECT
  USING (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create agents in their folders"
  ON agents FOR INSERT
  WITH CHECK (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update agents in their folders"
  ON agents FOR UPDATE
  USING (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete agents in their folders"
  ON agents FOR DELETE
  USING (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));

-- RLS: Agent Memories
CREATE POLICY "Users can read agent memories"
  ON agent_memories FOR SELECT
  USING (agent_id IN (
    SELECT a.id FROM agents a
    JOIN folders f ON a.folder_id = f.id
    WHERE f.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update agent memories"
  ON agent_memories FOR UPDATE
  USING (agent_id IN (
    SELECT a.id FROM agents a
    JOIN folders f ON a.folder_id = f.id
    WHERE f.owner_id = auth.uid()
  ));

-- RLS: Execution Logs
CREATE POLICY "Users can read execution logs"
  ON execution_logs FOR SELECT
  USING (agent_id IN (
    SELECT a.id FROM agents a
    JOIN folders f ON a.folder_id = f.id
    WHERE f.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create execution logs"
  ON execution_logs FOR INSERT
  WITH CHECK (agent_id IN (
    SELECT a.id FROM agents a
    JOIN folders f ON a.folder_id = f.id
    WHERE f.owner_id = auth.uid()
  ));

-- RLS: Notes
CREATE POLICY "Users can read notes"
  ON notes FOR SELECT
  USING (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create notes"
  ON notes FOR INSERT
  WITH CHECK (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update notes"
  ON notes FOR UPDATE
  USING (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));

-- RLS: Todos
CREATE POLICY "Users can read todos"
  ON todos FOR SELECT
  USING (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create todos"
  ON todos FOR INSERT
  WITH CHECK (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update todos"
  ON todos FOR UPDATE
  USING (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));

-- RLS: Charts
CREATE POLICY "Users can read charts"
  ON charts FOR SELECT
  USING (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create charts"
  ON charts FOR INSERT
  WITH CHECK (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update charts"
  ON charts FOR UPDATE
  USING (folder_id IN (SELECT id FROM folders WHERE owner_id = auth.uid()));
