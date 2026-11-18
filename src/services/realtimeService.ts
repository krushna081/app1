import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { VisitorStatus } from '../types/visitor';

export const realtimeService = {
  subscribeToVisitorUpdates(
    visitorId: string,
    onUpdate: (status: VisitorStatus) => void,
  ): RealtimeChannel {
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
          const next = payload.new as { status?: VisitorStatus };
          if (next.status) onUpdate(next.status);
        },
      )
      .subscribe();
  },

  subscribeToFlatVisitors(flatId: string, onVisitorChange: () => void): RealtimeChannel {
    return supabase
      .channel(`flat-${flatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visitors',
          filter: `flat_id=eq.${flatId}`,
        },
        () => onVisitorChange(),
      )
      .subscribe();
  },

  subscribeToSocietyVisitors(societyId: string, onVisitorChange: () => void): RealtimeChannel {
    return supabase
      .channel(`society-${societyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visitors',
          filter: `society_id=eq.${societyId}`,
        },
        () => onVisitorChange(),
      )
      .subscribe();
  },

  unsubscribe(channel: RealtimeChannel | null | undefined): void {
    if (channel) void supabase.removeChannel(channel);
  },
};
