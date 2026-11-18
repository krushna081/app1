import { supabase } from '../lib/supabase';
import { Flat } from '../types/flat';

export const flatService = {
  async getSocietyFlats(): Promise<Flat[]> {
    const { data, error } = await supabase
      .from('flats')
      .select('id, flat_number, society_id')
      .order('flat_number', { ascending: true });

    if (error) throw error;

    return (data ?? []).map((flat) => ({
      id: flat.id,
      flatNumber: flat.flat_number,
      societyId: flat.society_id,
    }));
  },
};
