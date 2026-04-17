export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      cases: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          dispute_type: string;
          merchant_name: string;
          issue_description: string;
          transaction_amount: number | null;
          incident_date: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          dispute_type: string;
          merchant_name: string;
          issue_description: string;
          transaction_amount?: number | null;
          incident_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          dispute_type?: string;
          merchant_name?: string;
          issue_description?: string;
          transaction_amount?: number | null;
          incident_date?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      evidence_files: {
        Row: {
          id: string;
          case_id: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          storage_bucket: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          storage_bucket?: string;
          created_at?: string;
        };
        Update: {
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          storage_bucket?: string;
        };
        Relationships: [];
      };
      analyses: {
        Row: {
          id: string;
          case_id: string;
          user_id: string;
          analysis_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id: string;
          analysis_json: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          analysis_json?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
