import { Database } from './database';

export type VisitorStatus = Database['public']['Tables']['visitors']['Row']['status'];

export interface Visitor {
  id: string;
  visitorName: string;
  visitorType: string;
  photoUrl: string | null;
  flatId: string;
  societyId: string;
  createdByGuardId: string;
  status: VisitorStatus;
  createdAt: string;
  flatNumber?: string;
}

export type VisitorType = 'guest' | 'maid' | 'delivery' | 'electrician' | 'plumber';
