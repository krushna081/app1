import { Database } from './database';

export type VisitorStatus = Database['public']['Tables']['visitors']['Row']['status'];
export type VisitorType = Database['public']['Tables']['visitors']['Row']['visitor_type'];

export interface Visitor {
  id: string;
  visitorName: string;
  visitorType: VisitorType;
  photoPath: string;
  photoUrl: string | null;
  flatId: string;
  flatNumber?: string;
  societyId: string;
  createdByGuardId: string;
  status: VisitorStatus;
  createdAt: string;
}
