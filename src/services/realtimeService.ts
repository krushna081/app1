import { supabase } from '../lib/supabase';
import { VisitorStatus } from '../types/visitor';

export const realtimeService = {
  subscribeToVisitorUpdates(visitorId: string, onUpdate: (status: VisitorStatus) => void) {
    return supabase
      .channel(`visitor-${visitorId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'visitors',
          filter: `id=eq.${visitorId}`,
        },
        (payload) => {
          onUpdate(payload.new.status);
        }
      )
      .subscribe();
  },

  subscribeToFlatVisitors(flatId: string, onNewVisitor: () => void) {
    return supabase
      .channel(`flat-${flatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visitors',
          filter: `flat_id=eq.${flatId}`,
        },
        () => {
          onNewVisitor();
        }
      )
      .subscribe();
  },

  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  },
};
