export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: "owner" | "tenant";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: "owner" | "tenant";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: "owner" | "tenant";
          created_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          status: "Available" | "Occupied" | "Storage";
          base_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: "Available" | "Occupied" | "Storage";
          base_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: "Available" | "Occupied" | "Storage";
          base_price?: number;
          created_at?: string;
        };
      };
      leases: {
        Row: {
          id: string;
          tenant_id: string;
          room_id: string;
          start_date: string;
          end_date: string | null;
          billing_cycle: number; // in months
          custom_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          room_id: string;
          start_date: string;
          end_date?: string | null;
          billing_cycle: number;
          custom_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          room_id?: string;
          start_date?: string;
          end_date?: string | null;
          billing_cycle?: number;
          custom_price?: number;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          lease_id: string;
          amount: number;
          due_date: string;
          status: "unpaid" | "pending_verification" | "paid";
          proof_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lease_id: string;
          amount: number;
          due_date: string;
          status?: "unpaid" | "pending_verification" | "paid";
          proof_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lease_id?: string;
          amount?: number;
          due_date?: string;
          status?: "unpaid" | "pending_verification" | "paid";
          proof_url?: string | null;
          created_at?: string;
        };
      };
      room_history: {
        Row: {
          id: string;
          room_id: string;
          tenant_id: string;
          action: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          tenant_id: string;
          action: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          tenant_id?: string;
          action?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
