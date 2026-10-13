/**
 * Database types for the AdmissionHack schema.
 *
 * Hand-authored to match `supabase/migrations/0001_admissionhack_schema.sql`.
 * Once the project is provisioned, regenerate with the Supabase CLI/MCP
 * (`generate_typescript_types`) and replace this file — then any drift between
 * the migration and the code becomes a compile error instead of a runtime one.
 */

export type AhRole = "student" | "counselor" | "parent";
export type AhTier = "dream" | "target" | "safe";
export type AhPortfolioKind = "activity" | "award" | "work" | "volunteering";

export interface Database {
  /** marker supabase-js reads to detect generated types */
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      ah_profiles: {
        Row: {
          id: string;
          role: AhRole;
          full_name: string;
          level: string | null;
          country: string | null;
          intake: string | null;
          budget: number | null;
          gpa: string | null;
          gpa_scale: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ah_profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["ah_profiles"]["Row"]>;
        Relationships: [];
      };
      ah_exam_results: {
        Row: {
          user_id: string;
          exam_id: string;
          overall: string | null;
          sections: Record<string, string>;
          taken_on: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ah_exam_results"]["Row"]> & {
          user_id: string;
          exam_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["ah_exam_results"]["Row"]>;
        Relationships: [];
      };
      ah_score_reports: {
        Row: {
          id: string;
          user_id: string;
          exam_id: string;
          file_path: string;
          file_name: string;
          mime_type: string | null;
          size_bytes: number | null;
          is_verified: boolean;
          uploaded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ah_score_reports"]["Row"]> & {
          user_id: string;
          exam_id: string;
          file_path: string;
          file_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["ah_score_reports"]["Row"]>;
        Relationships: [];
      };
      ah_university_lists: {
        Row: { user_id: string; university_slug: string; tier: AhTier; added_at: string };
        Insert: { user_id: string; university_slug: string; tier?: AhTier };
        Update: Partial<Database["public"]["Tables"]["ah_university_lists"]["Row"]>;
        Relationships: [];
      };
      ah_deadlines: {
        Row: { id: string; user_id: string; title: string; due_on: string; created_at: string };
        Insert: { user_id: string; title: string; due_on: string };
        Update: Partial<Database["public"]["Tables"]["ah_deadlines"]["Row"]>;
        Relationships: [];
      };
      ah_portfolio: {
        Row: {
          id: string;
          user_id: string;
          kind: AhPortfolioKind;
          title: string;
          org: string | null;
          description: string | null;
          years: string | null;
          hours: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ah_portfolio"]["Row"]> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["ah_portfolio"]["Row"]>;
        Relationships: [];
      };
      ah_documents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          file_path: string;
          mime_type: string | null;
          size_bytes: number | null;
          uploaded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ah_documents"]["Row"]> & {
          user_id: string;
          name: string;
          file_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["ah_documents"]["Row"]>;
        Relationships: [];
      };
      ah_checklist: {
        Row: { user_id: string; doc_key: string; done: boolean };
        Insert: { user_id: string; doc_key: string; done?: boolean };
        Update: Partial<Database["public"]["Tables"]["ah_checklist"]["Row"]>;
        Relationships: [];
      };
      ah_counselor_links: {
        Row: {
          id: string;
          counselor_id: string;
          student_email: string;
          student_id: string | null;
          status: "pending" | "active" | "revoked";
          created_at: string;
        };
        Insert: {
          counselor_id: string;
          student_email: string;
          student_id?: string | null;
          status?: "pending" | "active" | "revoked";
        };
        Update: Partial<Database["public"]["Tables"]["ah_counselor_links"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { ah_role: AhRole; ah_tier: AhTier; ah_portfolio_kind: AhPortfolioKind };
    CompositeTypes: Record<string, never>;
  };
}
