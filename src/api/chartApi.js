import { supabase } from '@/utils/supabaseClient';
export const chartApi = {
    async listCharts(folderId) {
        const { data, error } = await supabase
            .from('charts')
            .select('*')
            .eq('folder_id', folderId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    },
    async getChart(chartId) {
        const { data, error } = await supabase
            .from('charts')
            .select('*')
            .eq('id', chartId)
            .single();
        if (error)
            throw error;
        return data;
    },
    async createChart(chart) {
        const { data, error } = await supabase
            .from('charts')
            .insert([chart])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async updateChart(chartId, updates) {
        const { data, error } = await supabase
            .from('charts')
            .update(updates)
            .eq('id', chartId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async deleteChart(chartId) {
        const { error } = await supabase
            .from('charts')
            .delete()
            .eq('id', chartId);
        if (error)
            throw error;
    },
};
