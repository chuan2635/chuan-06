import { supabase } from '@/utils/supabaseClient';
export const folderApi = {
    async listFolders(ownerId) {
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    },
    async getFolder(folderId) {
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .eq('id', folderId)
            .single();
        if (error)
            throw error;
        return data;
    },
    async createFolder(folder) {
        const { data, error } = await supabase
            .from('folders')
            .insert([folder])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async updateFolder(folderId, updates) {
        const { data, error } = await supabase
            .from('folders')
            .update(updates)
            .eq('id', folderId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async deleteFolder(folderId) {
        const { error } = await supabase
            .from('folders')
            .delete()
            .eq('id', folderId);
        if (error)
            throw error;
    },
};
