import { supabase } from '@/utils/supabaseClient';
import { Folder } from '@/types';

export const folderApi = {
  async listFolders(ownerId: string) {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Folder[];
  },

  async getFolder(folderId: string) {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .single();

    if (error) throw error;
    return data as Folder;
  },

  async createFolder(folder: Omit<Folder, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('folders')
      .insert([folder])
      .select()
      .single();

    if (error) throw error;
    return data as Folder;
  },

  async updateFolder(folderId: string, updates: Partial<Folder>) {
    const { data, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    return data as Folder;
  },

  async deleteFolder(folderId: string) {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (error) throw error;
  },
};
