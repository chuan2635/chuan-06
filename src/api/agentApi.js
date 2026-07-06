import { supabase } from '@/utils/supabaseClient';
export const agentApi = {
    // Agents CRUD
    async listAgents(folderId) {
        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('folder_id', folderId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    },
    async getAgent(agentId) {
        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .single();
        if (error)
            throw error;
        return data;
    },
    async createAgent(agent) {
        const { data, error } = await supabase
            .from('agents')
            .insert([agent])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async updateAgent(agentId, updates) {
        const { data, error } = await supabase
            .from('agents')
            .update(updates)
            .eq('id', agentId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async deleteAgent(agentId) {
        const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', agentId);
        if (error)
            throw error;
    },
    // Agent Memory
    async getMemory(agentId) {
        const { data, error } = await supabase
            .from('agent_memories')
            .select('*')
            .eq('agent_id', agentId)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error; // PGRST116 = no rows
        return data;
    },
    async updateMemory(agentId, content) {
        const existing = await this.getMemory(agentId);
        if (existing) {
            const { data, error } = await supabase
                .from('agent_memories')
                .update({ content, updated_at: new Date().toISOString() })
                .eq('agent_id', agentId)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        else {
            const { data, error } = await supabase
                .from('agent_memories')
                .insert([{ agent_id: agentId, content }])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
    },
    // Execution Logs
    async listExecutionLogs(agentId, limit = 50) {
        const { data, error } = await supabase
            .from('execution_logs')
            .select('*')
            .eq('agent_id', agentId)
            .order('started_at', { ascending: false })
            .limit(limit);
        if (error)
            throw error;
        return data;
    },
    async getExecutionStats(agentId) {
        const logs = await this.listExecutionLogs(agentId, 100);
        const successLogs = logs.filter((log) => log.status === 'success');
        const totalExecutions = logs.length;
        const successCount = successLogs.length;
        const failureCount = logs.filter((log) => log.status === 'failed').length;
        const avgDuration = successLogs.length > 0
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
    async createExecutionLog(log) {
        const { data, error } = await supabase
            .from('execution_logs')
            .insert([log])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async updateExecutionLog(logId, updates) {
        const { data, error } = await supabase
            .from('execution_logs')
            .update(updates)
            .eq('id', logId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    // Agent Budget
    async getBudget(agentId) {
        const { data, error } = await supabase
            .from('agent_budgets')
            .select('*')
            .eq('agent_id', agentId)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
        return data || null;
    },
    async updateBudget(agentId, monthlyLimit) {
        const existing = await this.getBudget(agentId);
        if (existing) {
            const { data, error } = await supabase
                .from('agent_budgets')
                .update({ monthly_limit: monthlyLimit })
                .eq('agent_id', agentId)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        else {
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
            if (error)
                throw error;
            return data;
        }
    },
};
