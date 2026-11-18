import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { Visitor, VisitorStatus, VisitorType } from '../types/visitor';
import { flatService } from './flatService';

type VisitorRow = Database['public']['Tables']['visitors']['Row'];

function mapVisitor(row: VisitorRow, flatNumber?: string, photoUrl?: string): Visitor {
  return {
    id: row.id,
    visitorName: row.visitor_name,
    visitorType: row.visitor_type,
    photoPath: row.photo_path,
    photoUrl: photoUrl ?? null,
    flatId: row.flat_id,
    flatNumber,
    societyId: row.society_id,
    createdByGuardId: row.created_by_guard_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function withDisplayData(rows: VisitorRow[]): Promise<Visitor[]> {
  if (rows.length === 0) return [];

  const photoPaths = Array.from(new Set(rows.map((row) => row.photo_path)));

  const [flats, signedPhotos] = await Promise.all([
    flatService.getSocietyFlats().catch(() => []),
    supabase.storage
      .from('visitor-photos')
      .createSignedUrls(photoPaths, 300)
      .catch(() => ({ data: null, error: null })),
  ]);

  const flatNumbers = new Map(flats.map((flat) => [flat.id, flat.flatNumber]));
  const photoUrls = new Map<string, string>();
  signedPhotos.data?.forEach((photo) => {
    if (photo.path && photo.signedUrl) photoUrls.set(photo.path, photo.signedUrl);
  });

  return rows.map((row) =>
    mapVisitor(row, flatNumbers.get(row.flat_id), photoUrls.get(row.photo_path)),
  );
}

export const visitorService = {
  async createVisitor(input: {
    visitorName: string;
    visitorType: VisitorType;
    photoPath: string;
    flatId: string;
  }): Promise<Visitor> {
    const { data, error } = await supabase.rpc('create_visitor', {
      p_visitor_name: input.visitorName,
      p_visitor_type: input.visitorType,
      p_photo_path: input.photoPath,
      p_flat_id: input.flatId,
    });

    if (error) throw error;
    if (!data) throw new Error('Visitor was not created');

    return mapVisitor(data);
  },

  async updateVisitorStatus(visitorId: string, status: VisitorStatus): Promise<Visitor> {
    const { data, error } = await supabase.rpc('update_visitor_status', {
      p_visitor_id: visitorId,
      p_new_status: status,
    });

    if (error) throw error;
    if (!data) throw new Error('Visitor status was not updated');

    return mapVisitor(data);
  },

  async getResidentVisitors(): Promise<Visitor[]> {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return withDisplayData(data ?? []);
  },

  async getGuardVisitors(): Promise<Visitor[]> {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .in('status', ['approved', 'entered'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return withDisplayData(data ?? []);
  },
};
