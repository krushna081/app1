import { supabase } from '../lib/supabase';
import { Visitor, VisitorStatus } from '../types/visitor';

export const visitorService = {
  async createVisitor(visitor: Omit<Visitor, 'id' | 'createdAt' | 'status'>) {
    const { data, error } = await supabase
      .from('visitors')
      .insert({
        visitor_name: visitor.visitorName,
        visitor_type: visitor.visitorType,
        photo_url: visitor.photoUrl,
        flat_id: visitor.flatId,
        society_id: visitor.societyId,
        created_by_guard_id: visitor.createdByGuardId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateVisitorStatus(visitorId: string, status: VisitorStatus, userId: string) {
    const { data: currentVisitor, error: fetchError } = await supabase
      .from('visitors')
      .select('status')
      .eq('id', visitorId)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('visitors')
      .update({ status })
      .eq('id', visitorId);

    if (updateError) throw updateError;

    const { error: historyError } = await supabase
      .from('visitor_status_history')
      .insert({
        visitor_id: visitorId,
        previous_status: currentVisitor.status,
        new_status: status,
        changed_by: userId,
      });

    if (historyError) throw historyError;
  },

  async getResidentVisitors(flatId: string): Promise<Visitor[]> {
    const { data, error } = await supabase
      .from('visitors')
      .select('*, flats(flat_number)')
      .eq('flat_id', flatId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      visitorName: item.visitor_name,
      visitorType: item.visitor_type,
      photoUrl: item.photo_url,
      flatId: item.flat_id,
      societyId: item.society_id,
      createdByGuardId: item.created_by_guard_id,
      status: item.status,
      createdAt: item.created_at || '',
      flatNumber: (item.flats as any)?.flat_number,
    }));
  },

  async getSocietyFlats(societyId: string) {
    const { data, error } = await supabase
      .from('flats')
      .select('*')
      .eq('society_id', societyId);

    if (error) throw error;
    return data;
  }
};
