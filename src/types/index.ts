// Core Domain Types

export interface Folder {
  id: string;
  name: string;
  type: 'workspace' | 'folder';
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  folder_id: string;
  name: string;
  instructions: string;
  ai_model: 'Auto' | 'claude-opus-4-8' | 'claude-sonnet-4-6';
  max_rounds: number;
  schedule_cron: string | null;
  notifications_enabled: boolean;
  avatar_icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentMemory {
  id: string;
  agent_id: string;
  content: string; // Markdown
  updated_at: string;
}

export interface AgentSkill {
  id: string;
  agent_id: string;
  skill_type: string;
  config: Record<string, any> | null;
}

export interface AgentBudget {
  id: string;
  agent_id: string;
  monthly_limit: number;
  credits_used: number;
  period_start: string;
  period_end: string;
}

export type ExecutionStatus = 'running' | 'success' | 'cancelled' | 'failed';
export type TriggerType = 'manual' | 'schedule' | 'chat';

export interface ExecutionLog {
  id: string;
  agent_id: string;
  triggered_by: TriggerType;
  status: ExecutionStatus;
  duration_seconds: number;
  tokens_used: number;
  credits_used: number;
  started_at: string;
  ended_at: string;
  error_message: string | null;
}

export interface Note {
  id: string;
  folder_id: string;
  title: string;
  content: string; // Markdown
  created_by_agent_id: string | null;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

export interface Todo {
  id: string;
  folder_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  parent_id: string | null;
  assigned_to_agent_id: string | null;
  due_at: string | null;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface Chart {
  id: string;
  folder_id: string;
  title: string;
  chart_type: 'line' | 'bar' | 'pie' | 'scatter' | 'area';
  data: Record<string, any>;
  created_by_agent_id: string | null;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ListResponse<T> {
  data: T[];
  count: number;
  offset: number;
  limit: number;
}

// UI State Types
export interface AgentStats {
  avgCreditsCost: number;
  avgTokens: number;
  avgDuration: number; // seconds
}

export interface ExecutionStats {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  avgDuration: number;
  totalTokens: number;
  totalCredits: number;
}
