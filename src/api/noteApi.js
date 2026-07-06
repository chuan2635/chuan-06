import { supabase } from '@/utils/supabaseClient';
export const noteApi = {
    async listNotes(folderId) {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('folder_id', folderId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    },
    async getNote(noteId) {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('id', noteId)
            .single();
        if (error)
            throw error;
        return data;
    },
    async createNote(note) {
        const { data, error } = await supabase
            .from('notes')
            .insert([note])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async updateNote(noteId, updates) {
        const { data, error } = await supabase
            .from('notes')
            .update(updates)
            .eq('id', noteId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async deleteNote(noteId) {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId);
        if (error)
            throw error;
    },
    async toggleFavorite(noteId, isFavorite) {
        return this.updateNote(noteId, { is_favorite: !isFavorite });
    },
};
