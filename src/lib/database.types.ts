/**
 * Database types for AdmissionHack.
 *
 * GENERATED — do not hand-edit the `Database` type below. It comes from the live
 * project (`generate_typescript_types` against arpwvfphzryaaxrvegju, the shared
 * ecosystem project where the `ah_*` schema has been applied — see
 * supabase/ecosystem-migration.sql and 0003_application_tracker.sql). Regenerate
 * the same way whenever the migration changes; drift between the two then becomes
 * a compile error instead of a runtime one.
 *
 * Deliberate differences from the raw generator output:
 *   * the `Tables` / `TablesInsert` / `TablesUpdate` / `Enums` /
 *     `CompositeTypes` helper types and `Constants` are omitted. supabase-js
 *     consumes only the `Database` type; the helpers exist for app code, and
 *     this app addresses tables through the `T` map in ./supabase. Keep them if
 *     you start using them.
 *   * only the `ah_*` tables are kept. This database is shared with SAThack, so
 *     the generator also returns ~40 tables this app never touches; carrying
 *     them here would suggest otherwise.
 *   * the aliases at the bottom are appended by hand, so the rest of the code
 *     reads `AhRole` rather than `Database["public"]["Enums"]["ah_role"]`.
 *     Re-append them after regenerating.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Lets createClient infer the right PostgREST semantics without an explicit
  // second type argument. This value must match the live project — a wrong one
  // silently collapses every query type to `never`.
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      ah_checklist: {
        Row: {
          doc_key: string;
          done: boolean;
          user_id: string;
        };
        Insert: {
          doc_key: string;
          done?: boolean;
          user_id: string;
        };
        Update: {
          doc_key?: string;
          done?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ah_checklist_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "ah_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ah_counselor_links: {
        Row: {
          counselor_id: string;
          created_at: string;
          id: string;
          responded_at: string | null;
          status: string;
          student_email: string;
          student_id: string | null;
        };
        Insert: {
          counselor_id: string;
          created_at?: string;
          id?: string;
          responded_at?: string | null;
          status?: string;
          student_email: string;
          student_id?: string | null;
        };
        Update: {
          counselor_id?: string;
          created_at?: string;
          id?: string;
          responded_at?: string | null;
          status?: string;
          student_email?: string;
          student_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ah_counselor_links_counselor_id_fkey";
            columns: ["counselor_id"];
            isOneToOne: false;
            referencedRelation: "ah_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ah_counselor_links_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "ah_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ah_deadlines: {
        Row: {
          created_at: string;
          due_on: string;
          id: string;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          due_on: string;
          id?: string;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          due_on?: string;
          id?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ah_deadlines_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "ah_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ah_documents: {
        Row: {
          file_path: string;
          folder: string;
          id: string;
          mime_type: string | null;
          name: string;
          size_bytes: number | null;
          uploaded_at: string;
          user_id: string;
        };
        Insert: {
          file_path: string;
          folder?: string;
          id?: string;
          mime_type?: string | null;
          name: string;
          size_bytes?: number | null;
          uploaded_at?: string;
          user_id: string;
        };
        Update: {
          file_path?: string;
          folder?: string;
          id?: string;
          mime_type?: string | null;
          name?: string;
          size_bytes?: number | null;
          uploaded_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ah_documents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "ah_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ah_exam_results: {
        Row: {
          exam_id: string;
          overall: string | null;
          sections: Json;
          taken_on: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          exam_id: string;
          overall?: string | null;
          sections?: Json;
          taken_on?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          exam_id?: string;
          overall?: string | null;
          sections?: Json;
          taken_on?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ah_exam_results_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "ah_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ah_group_members: {
        Row: {
          group_id: string;
          joined_at: string;
          student_id: string;
        };
        Insert: {
          group_id: string;
          joined_at?: string;
          student_id: string;
        };
        Update: {
          group_id?: string;
          joined_at?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ah_group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "ah_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ah_group_members_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "ah_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ah_groups: {
        Row: {
          created_at: string;
          id: string;
          join_code: string;
          name: string;
          note: string | null;
          owner_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          join_code?: string;
          name: string;
          note?: string | null;
          owner_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          join_code?: string;
          name?: string;
          note?: string | null;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ah_groups_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "ah_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ah_portfolio: {
        Row: {
          created_at: string;
          description: string | null;
          hours: string | null;
          id: string;
          kind: Database["public"]["Enums"]["ah_portfolio_kind"];
          org: string | null;
          title: string;
          user_id: string;
          years: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          hours?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["ah_portfolio_kind"];
          org?: string | null;
          title: string;
          user_id: string;
          years?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          hours?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["ah_portfolio_kind"];
          org?: string | null;
          title?: string;
          user_id?: string;
          years?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ah_portfolio_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "ah_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ah_profiles: {
        Row: {
          budget: number | null;
          country: string | null;
          created_at: string;
          full_name: string;
          gpa: string | null;
          gpa_scale: string | null;
          id: string;
          intake: string | null;
          level: string | null;
          role: Database["public"]["Enums"]["ah_role"];
          updated_at: string;
        };
        Insert: {
          budget?: number | null;
          country?: string | null;
          created_at?: string;
          full_name?: string;
          gpa?: string | null;
          gpa_scale?: string | null;
          id: string;
          intake?: string | null;
          level?: string | null;
          role?: Database["public"]["Enums"]["ah_role"];
          updated_at?: string;
        };
        Update: {
          budget?: number | null;
          country?: string | null;
          created_at?: string;
          full_name?: string;
          gpa?: string | null;
          gpa_scale?: string | null;
          id?: string;
          intake?: string | null;
          level?: string | null;
          role?: Database["public"]["Enums"]["ah_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      ah_score_reports: {
        Row: {
          exam_id: string;
          file_name: string;
          file_path: string;
          id: string;
          is_verified: boolean;
          mime_type: string | null;
          size_bytes: number | null;
          uploaded_at: string;
          user_id: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          exam_id: string;
          file_name: string;
          file_path: string;
          id?: string;
          is_verified?: boolean;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_at?: string;
          user_id: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          exam_id?: string;
          file_name?: string;
          file_path?: string;
          id?: string;
          is_verified?: boolean;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_at?: string;
          user_id?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ah_score_reports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "ah_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ah_score_reports_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "ah_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ah_university_lists: {
        Row: {
          added_at: string;
          decided_on: string | null;
          status: string;
          submitted_on: string | null;
          tier: Database["public"]["Enums"]["ah_tier"];
          university_slug: string;
          user_id: string;
        };
        Insert: {
          added_at?: string;
          decided_on?: string | null;
          status?: string;
          submitted_on?: string | null;
          tier?: Database["public"]["Enums"]["ah_tier"];
          university_slug: string;
          user_id: string;
        };
        Update: {
          added_at?: string;
          decided_on?: string | null;
          status?: string;
          submitted_on?: string | null;
          tier?: Database["public"]["Enums"]["ah_tier"];
          university_slug?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ah_university_lists_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "ah_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ah_can_read_object: {
        Args: { obj_bucket: string; obj_name: string };
        Returns: boolean;
      };
      ah_ensure_profile: {
        Args: {
          p_full_name?: string;
          p_role?: Database["public"]["Enums"]["ah_role"];
        };
        Returns: {
          budget: number | null;
          country: string | null;
          created_at: string;
          full_name: string;
          gpa: string | null;
          gpa_scale: string | null;
          id: string;
          intake: string | null;
          level: string | null;
          role: Database["public"]["Enums"]["ah_role"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "ah_profiles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      ah_is_counselor_of: { Args: { student: string }; Returns: boolean };
      ah_is_my_counselor: { Args: { counselor: string }; Returns: boolean };
      ah_owns_group: { Args: { g: string }; Returns: boolean };
      ah_is_group_member: { Args: { g: string }; Returns: boolean };
      ah_is_my_group_owner: { Args: { counselor: string }; Returns: boolean };
      /** joins by code — entering the code is the student's consent */
      ah_join_group: {
        Args: { p_code: string };
        Returns: {
          created_at: string;
          id: string;
          join_code: string;
          name: string;
          note: string | null;
          owner_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "ah_groups";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      ah_portfolio_kind: "activity" | "award" | "work" | "volunteering";
      ah_role: "student" | "counselor" | "parent";
      ah_tier: "dream" | "target" | "safe";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

/* ── hand-appended aliases (re-append after regenerating) ─────────────────── */

export type AhRole = Database["public"]["Enums"]["ah_role"];
export type AhTier = Database["public"]["Enums"]["ah_tier"];
export type AhPortfolioKind = Database["public"]["Enums"]["ah_portfolio_kind"];
export type AhProfileRow = Database["public"]["Tables"]["ah_profiles"]["Row"];

/** `ah_counselor_links.status` is a CHECK constraint, not an enum, in Postgres. */
export type AhLinkStatus = "pending" | "active" | "revoked";
