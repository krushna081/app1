export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VisitorStatus = 'pending' | 'approved' | 'rejected' | 'entered' | 'exited';
export type VisitorType = 'guest' | 'maid' | 'delivery' | 'electrician' | 'plumber';
export type UserRole = 'admin' | 'guard' | 'resident';

export type Database = {
  public: {
    Tables: {
      societies: {
        Row: {
          address: string;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          address: string;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          address?: string;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      flats: {
        Row: {
          created_at: string;
          flat_number: string;
          id: string;
          society_id: string;
        };
        Insert: {
          created_at?: string;
          flat_number: string;
          id?: string;
          society_id: string;
        };
        Update: {
          created_at?: string;
          flat_number?: string;
          id?: string;
          society_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          flat_id: string | null;
          full_name: string;
          id: string;
          role: UserRole;
          society_id: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          flat_id?: string | null;
          full_name: string;
          id: string;
          role?: UserRole;
          society_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          flat_id?: string | null;
          full_name?: string;
          id?: string;
          role?: UserRole;
          society_id?: string | null;
        };
        Relationships: [];
      };
      visitors: {
        Row: {
          created_at: string;
          created_by_guard_id: string;
          flat_id: string;
          id: string;
          photo_path: string;
          society_id: string;
          status: VisitorStatus;
          visitor_name: string;
          visitor_type: VisitorType;
        };
        Insert: {
          created_at?: string;
          created_by_guard_id: string;
          flat_id: string;
          id?: string;
          photo_path: string;
          society_id: string;
          status?: VisitorStatus;
          visitor_name: string;
          visitor_type: VisitorType;
        };
        Update: {
          created_at?: string;
          created_by_guard_id?: string;
          flat_id?: string;
          id?: string;
          photo_path?: string;
          society_id?: string;
          status?: VisitorStatus;
          visitor_name?: string;
          visitor_type?: VisitorType;
        };
        Relationships: [];
      };
      visitor_status_history: {
        Row: {
          changed_by: string;
          created_at: string;
          id: string;
          new_status: VisitorStatus;
          previous_status: VisitorStatus | null;
          visitor_id: string;
        };
        Insert: {
          changed_by: string;
          created_at?: string;
          id?: string;
          new_status: VisitorStatus;
          previous_status?: VisitorStatus | null;
          visitor_id: string;
        };
        Update: {
          changed_by?: string;
          created_at?: string;
          id?: string;
          new_status?: VisitorStatus;
          previous_status?: VisitorStatus | null;
          visitor_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_visitor: {
        Args: {
          p_visitor_name: string;
          p_visitor_type: VisitorType;
          p_photo_path: string;
          p_flat_id: string;
        };
        Returns: Database['public']['Tables']['visitors']['Row'];
      };
      update_visitor_status: {
        Args: {
          p_visitor_id: string;
          p_new_status: VisitorStatus;
        };
        Returns: Database['public']['Tables']['visitors']['Row'];
      };
      current_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      current_society_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      current_flat_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_admin_of: {
        Args: { p_society_id: string };
        Returns: boolean;
      };
      can_access_visitor: {
        Args: { p_visitor_id: string };
        Returns: boolean;
      };
      can_access_visitor_photo: {
        Args: { p_object_name: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
