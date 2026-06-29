import { supabase } from '@/utils/supabaseClient';
import { Chart } from '@/types';

export const chartApi = {
  async listCharts(folderId: string) {
    const { data, error } = await supabase
      .from('charts')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Chart[];
  },

  async getChart(chartId: string) {
    const { data, error } = await supabase
      .from('charts')
      .select('*')
      .eq('id', chartId)
      .single();

    if (error) throw error;
    return data as Chart;
  },

  async createChart(chart: Omit<Chart, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('charts')
      .insert([chart])
      .select()
      .single();

    if (error) throw error;
    return data as Chart;
  },

  async updateChart(chartId: string, updates: Partial<Chart>) {
    const { data, error } = await supabase
      .from('charts')
      .update(updates)
      .eq('id', chartId)
      .select()
      .single();

    if (error) throw error;
    return data as Chart;
  },

  async deleteChart(chartId: string) {
    const { error } = await supabase
      .from('charts')
      .delete()
      .eq('id', chartId);

    if (error) throw error;
  },
};
