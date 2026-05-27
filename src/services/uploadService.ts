import { supabase } from '../lib/supabase';

export const uploadService = {
  async uploadVisitorPhoto(uri: string, fileName: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('visitor-photos')
      .upload(`${fileName}.jpg`, blob, {
        contentType: 'image/jpeg',
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('visitor-photos')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  },
};
