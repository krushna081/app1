export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      flats: {
        Row: {
          created_at: string | null
          flat_number: string
          id: string
          resident_id: string | null
          society_id: string
        }
        Insert: {
          created_at?: string | null
          flat_number: string
          id?: string
          resident_id?: string | null
          society_id: string
        }
        Update: {
          created_at?: string | null
          flat_number?: string
          id?: string
          resident_id?: string | null
          society_id?: string
        }
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          flat_id: string | null
          full_name: string
          id: string
          role: 'guard' | 'resident' | 'admin'
          society_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          flat_id?: string | null
          full_name: string
          id: string
          role?: 'guard' | 'resident' | 'admin'
          society_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          flat_id?: string | null
          full_name?: string
          id?: string
          role?: 'guard' | 'resident' | 'admin'
          society_id?: string | null
        }
      }
      societies: {
        Row: {
          address: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          name?: string
        }
      }
      visitor_status_history: {
        Row: {
          changed_by: string
          created_at: string | null
          id: string
          new_status: 'pending' | 'approved' | 'rejected' | 'entered' | 'exited'
          previous_status: 'pending' | 'approved' | 'rejected' | 'entered' | 'exited' | null
          visitor_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          id?: string
          new_status: 'pending' | 'approved' | 'rejected' | 'entered' | 'exited'
          previous_status?: 'pending' | 'approved' | 'rejected' | 'entered' | 'exited' | null
          visitor_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          id?: string
          new_status?: 'pending' | 'approved' | 'rejected' | 'entered' | 'exited'
          previous_status?: 'pending' | 'approved' | 'rejected' | 'entered' | 'exited' | null
          visitor_id?: string
        }
      }
      visitors: {
        Row: {
          created_at: string | null
          created_by_guard_id: string
          flat_id: string
          id: string
          photo_url: string | null
          society_id: string
          status: 'pending' | 'approved' | 'rejected' | 'entered' | 'exited'
          visitor_name: string
          visitor_type: string
        }
        Insert: {
          created_at?: string | null
          created_by_guard_id: string
          flat_id: string
          id?: string
          photo_url?: string | null
          society_id: string
          status?: 'pending' | 'approved' | 'rejected' | 'entered' | 'exited'
          visitor_name: string
          visitor_type: string
        }
        Update: {
          created_at?: string | null
          created_by_guard_id?: string
          flat_id?: string
          id?: string
          photo_url?: string | null
          society_id?: string
          status?: 'pending' | 'approved' | 'rejected' | 'entered' | 'exited'
          visitor_name?: string
          visitor_type?: string
        }
      }
    }
  }
}
