import { supabase } from '@/utils/supabaseClient';
import { Note } from '@/types';

export const noteApi = {
  async listNotes(folderId: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Note[];
  },

  async getNote(noteId: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (error) throw error;
    return data as Note;
  },

  async createNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('notes')
      .insert([note])
      .select()
      .single();

    if (error) throw error;
    return data as Note;
  },

  async updateNote(noteId: string, updates: Partial<Note>) {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data as Note;
  },

  async deleteNote(noteId: string) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },

  async toggleFavorite(noteId: string, isFavorite: boolean) {
    return this.updateNote(noteId, { is_favorite: !isFavorite });
  },
};
