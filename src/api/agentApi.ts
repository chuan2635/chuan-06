import { supabase } from '@/utils/supabaseClient';
import { Agent, AgentMemory, ExecutionLog, ExecutionStats } from '@/types';

export const agentApi = {
  // Agents CRUD
  async listAgents(folderId: string) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Agent[];
  },

  async getAgent(agentId: string) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) throw error;
    return data as Agent;
  },

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('agents')
      .insert([agent])
      .select()
      .single();

    if (error) throw error;
    return data as Agent;
  },

  async updateAgent(agentId: string, updates: Partial<Agent>) {
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;
    return data as Agent;
  },

  async deleteAgent(agentId: string) {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (error) throw error;
  },

  // Agent Memory
  async getMemory(agentId: string) {
    const { data, error } = await supabase
      .from('agent_memories')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data as AgentMemory | null;
  },

  async updateMemory(agentId: string, content: string) {
    const existing = await this.getMemory(agentId);

    if (existing) {
      const { data, error } = await supabase
        .from('agent_memories')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('agent_id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data as AgentMemory;
    } else {
      const { data, error } = await supabase
        .from('agent_memories')
        .insert([{ agent_id: agentId, content }])
        .select()
        .single();

      if (error) throw error;
      return data as AgentMemory;
    }
  },

  // Execution Logs
  async listExecutionLogs(agentId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('execution_logs')
      .select('*')
      .eq('agent_id', agentId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ExecutionLog[];
  },

  async getExecutionStats(agentId: string): Promise<ExecutionStats> {
    const logs = await this.listExecutionLogs(agentId, 100);

    const successLogs = logs.filter((log) => log.status === 'success');
    const totalExecutions = logs.length;
    const successCount = successLogs.length;
    const failureCount = logs.filter((log) => log.status === 'failed').length;

    const avgDuration =
      successLogs.length > 0
        ? successLogs.reduce((sum, log) => sum + log.duration_seconds, 0) /
          successLogs.length
        : 0;

    const totalTokens = logs.reduce((sum, log) => sum + log.tokens_used, 0);
    const totalCredits = logs.reduce((sum, log) => sum + log.credits_used, 0);

    return {
      totalExecutions,
      successCount,
      failureCount,
      avgDuration,
      totalTokens,
      totalCredits,
    };
  },

  async createExecutionLog(log: Omit<ExecutionLog, 'id'>) {
    const { data, error } = await supabase
      .from('execution_logs')
      .insert([log])
      .select()
      .single();

    if (error) throw error;
    return data as ExecutionLog;
  },

  async updateExecutionLog(logId: string, updates: Partial<ExecutionLog>) {
    const { data, error } = await supabase
      .from('execution_logs')
      .update(updates)
      .eq('id', logId)
      .select()
      .single();

    if (error) throw error;
    return data as ExecutionLog;
  },

  // Agent Budget
  async getBudget(agentId: string) {
    const { data, error } = await supabase
      .from('agent_budgets')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async updateBudget(agentId: string, monthlyLimit: number) {
    const existing = await this.getBudget(agentId);

    if (existing) {
      const { data, error } = await supabase
        .from('agent_budgets')
        .update({ monthly_limit: monthlyLimit })
        .eq('agent_id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('agent_budgets')
        .insert([
          {
            agent_id: agentId,
            monthly_limit: monthlyLimit,
            credits_used: 0,
            period_start: new Date().toISOString(),
            period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },
};
