export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      behavioral_curated_questions: {
        Row: {
          id: string;
          prompt: string;
          category: string;
          position: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          prompt: string;
          category: string;
          position: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["behavioral_curated_questions"]["Insert"]>;
        Relationships: [];
      };
      behavioral_answers: {
        Row: {
          id: string;
          user_id: string;
          custom_question_id: string | null;
          curated_question_id: string | null;
          story_id: string | null;
          company_slug: string | null;
          application_id: string | null;
          title: string;
          answer_text: string;
          opening_framing: string | null;
          details_to_emphasize: string | null;
          details_to_avoid: string | null;
          is_primary: boolean;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          custom_question_id?: string | null;
          curated_question_id?: string | null;
          story_id?: string | null;
          company_slug?: string | null;
          application_id?: string | null;
          title: string;
          answer_text?: string;
          opening_framing?: string | null;
          details_to_emphasize?: string | null;
          details_to_avoid?: string | null;
          is_primary?: boolean;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["behavioral_answers"]["Insert"]>;
        Relationships: [];
      };
      behavioral_custom_questions: {
        Row: {
          id: string;
          user_id: string;
          question_text: string;
          description: string | null;
          category: string;
          company_slug: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_text: string;
          description?: string | null;
          category?: string;
          company_slug?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["behavioral_custom_questions"]["Insert"]>;
        Relationships: [];
      };
      behavioral_saved_questions: {
        Row: {
          id: string;
          user_id: string;
          curated_question_id: string | null;
          custom_question_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          curated_question_id?: string | null;
          custom_question_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["behavioral_saved_questions"]["Insert"]>;
        Relationships: [{ foreignKeyName: "behavioral_saved_questions_custom_owner_fkey"; columns: ["custom_question_id", "user_id"]; isOneToOne: false; referencedRelation: "behavioral_custom_questions"; referencedColumns: ["id", "user_id"] }];
      };
      behavioral_stories: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          company_or_context: string | null;
          role: string | null;
          approximate_period: string | null;
          project: string | null;
          situation: string | null;
          task: string | null;
          action: string | null;
          result: string | null;
          reflection: string | null;
          short_summary: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          company_or_context?: string | null;
          role?: string | null;
          approximate_period?: string | null;
          project?: string | null;
          situation?: string | null;
          task?: string | null;
          action?: string | null;
          result?: string | null;
          reflection?: string | null;
          short_summary?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["behavioral_stories"]["Insert"]>;
        Relationships: [];
      };
      behavioral_story_question_links: {
        Row: {
          id: string;
          user_id: string;
          story_id: string;
          custom_question_id: string | null;
          curated_question_id: string | null;
          relevance: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          story_id: string;
          custom_question_id?: string | null;
          curated_question_id?: string | null;
          relevance?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["behavioral_story_question_links"]["Insert"]>;
        Relationships: [];
      };
      behavioral_story_themes: {
        Row: {
          id: string;
          user_id: string;
          story_id: string;
          theme: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          story_id: string;
          theme: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["behavioral_story_themes"]["Insert"]>;
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          company_slug: string | null;
          company_logo_url: string | null;
          role_title: string;
          role_level: string | null;
          location: string | null;
          job_url: string | null;
          application_date: string | null;
          source: string | null;
          status: string;
          recruiter_name: string | null;
          recruiter_email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          company_slug?: string | null;
          company_logo_url?: string | null;
          role_title: string;
          role_level?: string | null;
          location?: string | null;
          job_url?: string | null;
          application_date?: string | null;
          source?: string | null;
          status?: string;
          recruiter_name?: string | null;
          recruiter_email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
        Relationships: [{ foreignKeyName: "applications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      dsa_progress: {
        Row: {
          user_id: string;
          item_kind: "problem" | "roadmap-task" | "mixed-set" | "timed-practice";
          item_id: string;
          status: "attempted" | "solved" | "review" | "comfortable" | "in-progress" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          item_kind: "problem" | "roadmap-task" | "mixed-set" | "timed-practice";
          item_id: string;
          status: "attempted" | "solved" | "review" | "comfortable" | "in-progress" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "attempted" | "solved" | "review" | "comfortable" | "in-progress" | "completed";
          updated_at?: string;
        };
        Relationships: [{ foreignKeyName: "dsa_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      account_action_rate_limits: {
        Row: {
          user_id: string;
          action: "account_export";
          window_started_at: string;
          request_count: number;
          last_request_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          action: "account_export";
          window_started_at?: string;
          request_count?: number;
          last_request_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["account_action_rate_limits"]["Insert"]>;
        Relationships: [{ foreignKeyName: "account_action_rate_limits_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      admin_memberships: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["admin_memberships"]["Insert"]>;
        Relationships: [{ foreignKeyName: "admin_memberships_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      feedback_submissions: {
        Row: { id: string; reference_id: string; actor_id: string | null; submitted_as_authenticated: boolean; category: "bug" | "suggestion" | "content_source" | "accessibility" | "privacy_safety" | "other"; message: string; page_context: string | null; contact_email: string | null; contact_consent: boolean; status: "new" | "triaged" | "planned" | "resolved" | "closed" | "spam"; admin_note: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; reference_id: string; actor_id?: string | null; submitted_as_authenticated?: boolean; category: "bug" | "suggestion" | "content_source" | "accessibility" | "privacy_safety" | "other"; message: string; page_context?: string | null; contact_email?: string | null; contact_consent?: boolean; status?: "new" | "triaged" | "planned" | "resolved" | "closed" | "spam"; admin_note?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["feedback_submissions"]["Insert"]>;
        Relationships: [{ foreignKeyName: "feedback_submissions_actor_id_fkey"; columns: ["actor_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      feedback_submission_rate_limits: {
        Row: { subject_key: string; window_started_at: string; request_count: number; last_request_at: string; created_at: string };
        Insert: { subject_key: string; window_started_at?: string; request_count?: number; last_request_at?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["feedback_submission_rate_limits"]["Insert"]>;
        Relationships: [];
      };
      admin_audit_events: {
        Row: { id: string; admin_actor_id: string | null; action_type: "feedback_status_changed" | "feedback_note_updated" | "experience_moderated"; target_type: "feedback_submission" | "interview_experience"; target_id: string; prior_status: string | null; new_status: string | null; created_at: string };
        Insert: { id?: string; admin_actor_id?: string | null; action_type: "feedback_status_changed" | "feedback_note_updated" | "experience_moderated"; target_type: "feedback_submission" | "interview_experience"; target_id: string; prior_status?: string | null; new_status?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["admin_audit_events"]["Insert"]>;
        Relationships: [{ foreignKeyName: "admin_audit_events_admin_actor_id_fkey"; columns: ["admin_actor_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      dsa_question_catalog: {
        Row: { id: string };
        Insert: { id: string };
        Update: { id?: string };
        Relationships: [];
      };
      mock_interview_sessions: {
        Row: { id: string; user_id: string; track: "dsa" | "system-design" | "ml-design" | "behavioral"; practice_mode: "solo" | "peer"; plan_id: string; prompt_id: string; rubric_id: string; started_at: string; reviewed_at: string | null; elapsed_seconds: number | null; strength: string | null; improvement: string | null; follow_up_practice: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; track: "dsa" | "system-design" | "ml-design" | "behavioral"; practice_mode: "solo" | "peer"; plan_id: string; prompt_id: string; rubric_id: string; started_at?: string; reviewed_at?: string | null; elapsed_seconds?: number | null; strength?: string | null; improvement?: string | null; follow_up_practice?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["mock_interview_sessions"]["Insert"]>; Relationships: [];
      };
      mock_interview_rubric_ratings: {
        Row: { session_id: string; dimension_id: string; rating: "Strong" | "Developing" | "Needs attention" };
        Insert: { session_id: string; dimension_id: string; rating: "Strong" | "Developing" | "Needs attention" }; Update: Partial<Database["public"]["Tables"]["mock_interview_rubric_ratings"]["Insert"]>; Relationships: [];
      };
      interview_experiences: {
        Row: { id: string; author_id: string; status: "draft" | "submitted" | "needs_changes" | "approved" | "rejected" | "archived" | "withdrawn"; company_name: string; role_title: string; role_level: string | null; region: string | null; interview_date: string | null; summary: string; preparation_lessons: string | null; public_identity: "anonymous" | "username"; publication_consent: boolean; submitted_at: string | null; reviewed_at: string | null; review_note: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; author_id: string; status?: "draft" | "submitted" | "needs_changes" | "approved" | "rejected" | "archived" | "withdrawn"; company_name?: string; role_title?: string; role_level?: string | null; region?: string | null; interview_date?: string | null; summary?: string; preparation_lessons?: string | null; public_identity?: "anonymous" | "username"; publication_consent?: boolean; submitted_at?: string | null; reviewed_at?: string | null; review_note?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["interview_experiences"]["Insert"]>; Relationships: [{ foreignKeyName: "interview_experiences_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      interview_experience_rounds: {
        Row: { id: string; experience_id: string; position: number; round_type: string; topic_labels: string[]; process_notes: string | null };
        Insert: { id?: string; experience_id: string; position: number; round_type: string; topic_labels?: string[]; process_notes?: string | null };
        Update: Partial<Database["public"]["Tables"]["interview_experience_rounds"]["Insert"]>; Relationships: [{ foreignKeyName: "interview_experience_rounds_experience_id_fkey"; columns: ["experience_id"]; isOneToOne: false; referencedRelation: "interview_experiences"; referencedColumns: ["id"] }];
      };
      dsa_question_progress: {
        Row: {
          user_id: string;
          question_id: string;
          status: "not_started" | "attempted" | "solved" | "review";
          confidence: "low" | "medium" | "high" | null;
          bookmarked: boolean;
          notes: string | null;
          first_attempted_at: string | null;
          last_practiced_at: string | null;
          solved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          question_id: string;
          status?: "not_started" | "attempted" | "solved" | "review";
          confidence?: "low" | "medium" | "high" | null;
          bookmarked?: boolean;
          notes?: string | null;
          first_attempted_at?: string | null;
          last_practiced_at?: string | null;
          solved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dsa_question_progress"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "dsa_question_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "dsa_question_progress_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "dsa_question_catalog"; referencedColumns: ["id"] },
        ];
      };
      interview_rounds: {
        Row: {
          id: string;
          application_id: string;
          user_id: string;
          round_number: number;
          round_name: string;
          round_type: string;
          scheduled_at: string | null;
          duration_minutes: number | null;
          timezone: string | null;
          interviewer_name: string | null;
          interviewer_role: string | null;
          meeting_link: string | null;
          location: string | null;
          status: string;
          result: string;
          notes: string | null;
          calendar_revision: number;
          reminder_schedule_revision: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          user_id: string;
          round_number: number;
          round_name: string;
          round_type: string;
          scheduled_at?: string | null;
          duration_minutes?: number | null;
          timezone?: string | null;
          interviewer_name?: string | null;
          interviewer_role?: string | null;
          meeting_link?: string | null;
          location?: string | null;
          status?: string;
          result?: string;
          notes?: string | null;
          calendar_revision?: number;
          reminder_schedule_revision?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interview_rounds"]["Insert"]>;
        Relationships: [{ foreignKeyName: "interview_rounds_application_id_fkey"; columns: ["application_id"]; isOneToOne: false; referencedRelation: "applications"; referencedColumns: ["id"] }];
      };
      interview_preparations: {
        Row: {
          id: string; round_id: string; user_id: string; private_notes: string | null;
          completed_template_item_ids: string[]; topics_asked: string | null; went_well: string | null;
          needs_improvement: string | null; follow_up_notes: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; round_id: string; user_id: string; private_notes?: string | null;
          completed_template_item_ids?: string[]; topics_asked?: string | null; went_well?: string | null;
          needs_improvement?: string | null; follow_up_notes?: string | null; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interview_preparations"]["Insert"]>;
        Relationships: [{ foreignKeyName: "interview_preparations_round_owner_fkey"; columns: ["round_id", "user_id"]; isOneToOne: true; referencedRelation: "interview_rounds"; referencedColumns: ["id", "user_id"] }];
      };
      interview_preparation_custom_tasks: {
        Row: { id: string; round_id: string; user_id: string; title: string; completed: boolean; position: number; created_at: string; updated_at: string };
        Insert: { id?: string; round_id: string; user_id: string; title: string; completed?: boolean; position?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["interview_preparation_custom_tasks"]["Insert"]>;
        Relationships: [{ foreignKeyName: "interview_preparation_tasks_round_owner_fkey"; columns: ["round_id", "user_id"]; isOneToOne: false; referencedRelation: "interview_rounds"; referencedColumns: ["id", "user_id"] }];
      };
      interview_reminder_preferences: {
        Row: {
          user_id: string;
          preferred_timezone: string | null;
          in_app_enabled: boolean;
          prep_3_days_enabled: boolean;
          interview_1_day_enabled: boolean;
          interview_1_hour_enabled: boolean;
          email_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preferred_timezone?: string | null;
          in_app_enabled?: boolean;
          prep_3_days_enabled?: boolean;
          interview_1_day_enabled?: boolean;
          interview_1_hour_enabled?: boolean;
          email_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interview_reminder_preferences"]["Insert"]>;
        Relationships: [];
      };
      interview_reminders: {
        Row: {
          id: string;
          user_id: string;
          round_id: string;
          reminder_type: "prep_3_days" | "interview_1_day" | "interview_1_hour";
          channel: "in_app" | "email";
          schedule_revision: number;
          scheduled_for: string;
          status: "pending" | "processing" | "delivered" | "cancelled" | "failed";
          attempt_count: number;
          next_attempt_at: string | null;
          claim_token: string | null;
          claimed_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          last_error_code: string | null;
          last_error_at: string | null;
          provider_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          round_id: string;
          reminder_type: "prep_3_days" | "interview_1_day" | "interview_1_hour";
          channel: "in_app" | "email";
          schedule_revision: number;
          scheduled_for: string;
          status?: "pending" | "processing" | "delivered" | "cancelled" | "failed";
          attempt_count?: number;
          next_attempt_at?: string | null;
          claim_token?: string | null;
          claimed_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          last_error_code?: string | null;
          last_error_at?: string | null;
          provider_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interview_reminders"]["Insert"]>;
        Relationships: [{ foreignKeyName: "interview_reminders_round_owner_fkey"; columns: ["round_id", "user_id"]; isOneToOne: false; referencedRelation: "interview_rounds"; referencedColumns: ["id", "user_id"] }];
      };
      interview_calendar_exports: {
        Row: {
          user_id: string;
          round_id: string;
          provider: "ics" | "google";
          exported_revision: number;
          export_count: number;
          first_exported_at: string;
          last_exported_at: string;
        };
        Insert: {
          user_id: string;
          round_id: string;
          provider: "ics" | "google";
          exported_revision: number;
          export_count?: number;
          first_exported_at?: string;
          last_exported_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interview_calendar_exports"]["Insert"]>;
        Relationships: [{ foreignKeyName: "interview_calendar_exports_round_owner_fkey"; columns: ["round_id", "user_id"]; isOneToOne: false; referencedRelation: "interview_rounds"; referencedColumns: ["id", "user_id"] }];
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          bio: string | null;
          current_company: string | null;
          current_role: string | null;
          years_experience: number | null;
          linkedin_url: string | null;
          github_url: string | null;
          avatar_url: string | null;
          is_public: boolean;
          onboarding_complete: boolean;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          current_company?: string | null;
          current_role?: string | null;
          years_experience?: number | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          avatar_url?: string | null;
          is_public?: boolean;
          onboarding_complete?: boolean;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          current_company?: string | null;
          current_role?: string | null;
          years_experience?: number | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          avatar_url?: string | null;
          is_public?: boolean;
          onboarding_complete?: boolean;
          onboarding_completed_at?: string | null;
        };
        Relationships: [];
      };
      preparation_track_progress: {
        Row: {
          user_id: string;
          track: "ml-design" | "behavioral";
          item_id: string;
          status: "in-progress" | "completed";
          completed_at: string | null;
          last_interacted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          track: "ml-design" | "behavioral";
          item_id: string;
          status: "in-progress" | "completed";
          completed_at?: string | null;
          last_interacted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "in-progress" | "completed";
          completed_at?: string | null;
          last_interacted_at?: string;
          updated_at?: string;
        };
        Relationships: [{ foreignKeyName: "preparation_track_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      system_design_progress: {
        Row: {
          user_id: string;
          item_kind: "topic" | "practice" | "review" | "simulation";
          item_id: string;
          status: "in-progress" | "completed";
          completed_at: string | null;
          last_interacted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          item_kind: "topic" | "practice" | "review" | "simulation";
          item_id: string;
          status: "in-progress" | "completed";
          completed_at?: string | null;
          last_interacted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "in-progress" | "completed";
          completed_at?: string | null;
          last_interacted_at?: string;
          updated_at?: string;
        };
        Relationships: [{ foreignKeyName: "system_design_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      system_design_item_catalog: {
        Row: { id: string; item_type: "concept" | "design_problem" };
        Insert: { id: string; item_type: "concept" | "design_problem" };
        Update: { id?: string; item_type?: "concept" | "design_problem" };
        Relationships: [];
      };
      system_design_item_progress: {
        Row: {
          user_id: string;
          item_id: string;
          item_type: "concept" | "design_problem";
          status: "not_started" | "reviewed" | "review" | "comfortable";
          confidence: "low" | "medium" | "high" | null;
          bookmarked: boolean;
          notes: string | null;
          first_reviewed_at: string | null;
          last_practiced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          item_id: string;
          item_type: "concept" | "design_problem";
          status?: "not_started" | "reviewed" | "review" | "comfortable";
          confidence?: "low" | "medium" | "high" | null;
          bookmarked?: boolean;
          notes?: string | null;
          first_reviewed_at?: string | null;
          last_practiced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["system_design_item_progress"]["Insert"]>;
        Relationships: [];
      };
      system_design_attempts: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          catalog_item_type: "design_problem";
          application_id: string | null;
          title: string;
          status: "draft" | "practiced" | "review";
          confidence: "low" | "medium" | "high" | null;
          document: Json;
          revision: number;
          first_practiced_at: string | null;
          last_practiced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          catalog_item_type?: "design_problem";
          application_id?: string | null;
          title: string;
          status?: "draft" | "practiced" | "review";
          confidence?: "low" | "medium" | "high" | null;
          document: Json;
          revision?: number;
          first_practiced_at?: string | null;
          last_practiced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["system_design_attempts"]["Insert"]>;
        Relationships: [];
      };
      user_preparation_preferences: {
        Row: {
          user_id: string;
          dsa_level: "sde1" | "sde2" | "sde3plus" | null;
          dsa_plan_id: "two-week" | "30d" | "60d" | "90d" | "no-deadline" | null;
          dsa_company_slug: string | null;
          dsa_preferred_language_slug: string | null;
          dsa_interview_date: string | null;
          system_design_level: "sde1" | "sde2" | "senior" | "staff" | null;
          system_design_preparation_window: "3-days" | "1-week" | "2-weeks" | "1-month" | "2-plus-months" | null;
          system_design_role: "backend" | "fullstack" | "infrastructure" | "data" | "ml" | null;
          system_design_minutes_per_day: 30 | 60 | 120 | 180 | null;
          preferred_role_level: "sde1" | "sde2" | "senior" | "staff" | "unsure" | null;
          primary_preparation_focus: "dsa" | "system_design" | "behavioral" | "applications" | "unsure" | null;
          local_system_design_import_version: number | null;
          local_system_design_imported_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          dsa_level?: "sde1" | "sde2" | "sde3plus" | null;
          dsa_plan_id?: "two-week" | "30d" | "60d" | "90d" | "no-deadline" | null;
          dsa_company_slug?: string | null;
          dsa_preferred_language_slug?: string | null;
          dsa_interview_date?: string | null;
          system_design_level?: "sde1" | "sde2" | "senior" | "staff" | null;
          system_design_preparation_window?: "3-days" | "1-week" | "2-weeks" | "1-month" | "2-plus-months" | null;
          system_design_role?: "backend" | "fullstack" | "infrastructure" | "data" | "ml" | null;
          system_design_minutes_per_day?: 30 | 60 | 120 | 180 | null;
          preferred_role_level?: "sde1" | "sde2" | "senior" | "staff" | "unsure" | null;
          primary_preparation_focus?: "dsa" | "system_design" | "behavioral" | "applications" | "unsure" | null;
          local_system_design_import_version?: number | null;
          local_system_design_imported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          dsa_level?: "sde1" | "sde2" | "sde3plus" | null;
          dsa_plan_id?: "two-week" | "30d" | "60d" | "90d" | "no-deadline" | null;
          dsa_company_slug?: string | null;
          dsa_preferred_language_slug?: string | null;
          dsa_interview_date?: string | null;
          system_design_level?: "sde1" | "sde2" | "senior" | "staff" | null;
          system_design_preparation_window?: "3-days" | "1-week" | "2-weeks" | "1-month" | "2-plus-months" | null;
          system_design_role?: "backend" | "fullstack" | "infrastructure" | "data" | "ml" | null;
          system_design_minutes_per_day?: 30 | 60 | 120 | 180 | null;
          preferred_role_level?: "sde1" | "sde2" | "senior" | "staff" | "unsure" | null;
          primary_preparation_focus?: "dsa" | "system_design" | "behavioral" | "applications" | "unsure" | null;
          local_system_design_import_version?: number | null;
          local_system_design_imported_at?: string | null;
          updated_at?: string;
        };
        Relationships: [{ foreignKeyName: "user_preparation_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      interview_playbook_diagnostic_settings: {
        Row: {
          user_id: string;
          available_hours_per_week: number | null;
          behavioral_stories_coverage: "unknown" | "not-started" | "partial" | "covered";
          project_deep_dive_coverage: "unknown" | "not-started" | "partial" | "covered";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          available_hours_per_week?: number | null;
          behavioral_stories_coverage?: "unknown" | "not-started" | "partial" | "covered";
          project_deep_dive_coverage?: "unknown" | "not-started" | "partial" | "covered";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interview_playbook_diagnostic_settings"]["Insert"]>;
        Relationships: [{ foreignKeyName: "interview_playbook_diagnostic_settings_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      interview_playbook_confidence: {
        Row: {
          user_id: string;
          area:
            | "algorithmic-coding"
            | "practical-coding"
            | "debugging"
            | "code-review"
            | "low-level-design"
            | "system-design"
            | "ml-system-design"
            | "behavioral"
            | "project-deep-dive";
          confidence: "low" | "medium" | "high";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          area:
            | "algorithmic-coding"
            | "practical-coding"
            | "debugging"
            | "code-review"
            | "low-level-design"
            | "system-design"
            | "ml-system-design"
            | "behavioral"
            | "project-deep-dive";
          confidence: "low" | "medium" | "high";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interview_playbook_confidence"]["Insert"]>;
        Relationships: [{ foreignKeyName: "interview_playbook_confidence_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      interview_playbook_priorities: {
        Row: {
          user_id: string;
          area:
            | "algorithmic-coding"
            | "practical-coding"
            | "debugging"
            | "code-review"
            | "low-level-design"
            | "system-design"
            | "ml-system-design"
            | "behavioral"
            | "project-deep-dive";
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          area:
            | "algorithmic-coding"
            | "practical-coding"
            | "debugging"
            | "code-review"
            | "low-level-design"
            | "system-design"
            | "ml-system-design"
            | "behavioral"
            | "project-deep-dive";
          position: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interview_playbook_priorities"]["Insert"]>;
        Relationships: [{ foreignKeyName: "interview_playbook_priorities_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      interview_playbook_constraints: {
        Row: {
          id: string;
          user_id: string;
          category: "work" | "school" | "health" | "family" | "other";
          description: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: "work" | "school" | "health" | "family" | "other";
          description: string;
          position: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interview_playbook_constraints"]["Insert"]>;
        Relationships: [{ foreignKeyName: "interview_playbook_constraints_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
    };
    Views: Record<string, never>;
    Functions: {
      import_preparation_track_progress_if_absent: {
        Args: { target_track: "ml-design" | "behavioral"; target_item_id: string; target_status: "in-progress" | "completed" };
        Returns: boolean;
      };
      save_preparation_track_progress: {
        Args: { target_track: "ml-design" | "behavioral"; target_item_id: string; target_status: "in-progress" | "completed" };
        Returns: Database["public"]["Tables"]["preparation_track_progress"]["Row"][];
      };
      save_interview_experience_draft: { Args: { target_id: string | null; payload: Json }; Returns: string };
      submit_interview_experience: { Args: { target_id: string }; Returns: boolean };
      withdraw_interview_experience: { Args: { target_id: string }; Returns: boolean };
      delete_interview_experience: { Args: { target_id: string }; Returns: boolean };
      is_current_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      submit_feedback_submission: { Args: { payload: Json; anonymous_subject?: string | null }; Returns: string };
      export_own_feedback_submissions: { Args: Record<PropertyKey, never>; Returns: { reference_id: string; category: "bug" | "suggestion" | "content_source" | "accessibility" | "privacy_safety" | "other"; message: string; page_context: string | null; contact_email: string | null; contact_consent: boolean; status: "new" | "triaged" | "planned" | "resolved" | "closed" | "spam"; created_at: string; updated_at: string }[] };
      update_feedback_submission: { Args: { target_id: string; next_status: "new" | "triaged" | "planned" | "resolved" | "closed" | "spam"; next_note?: string | null }; Returns: boolean };
      moderate_interview_experience: { Args: { target_id: string; next_status: "needs_changes" | "approved" | "rejected"; moderation_note?: string | null }; Returns: boolean };
      save_mock_interview_review: { Args: { target_session_id: string; target_track: "dsa" | "system-design" | "ml-design" | "behavioral"; target_mode: "solo" | "peer"; target_plan_id: string; target_prompt_id: string; target_rubric_id: string; target_started_at: string; target_elapsed_seconds: number; target_strength: string | null; target_improvement: string | null; target_follow_up_practice: string | null; target_ratings: Json }; Returns: string };
      create_interview_round: {
        Args: {
          target_application_id: string;
          round_name_value: string;
          round_type_value: string;
          scheduled_at_value?: string | null;
          duration_minutes_value?: number | null;
          timezone_value?: string | null;
          interviewer_name_value?: string | null;
          interviewer_role_value?: string | null;
          meeting_link_value?: string | null;
          location_value?: string | null;
          status_value?: string;
          result_value?: string;
          notes_value?: string | null;
        };
        Returns: string | null;
      };
      save_interview_playbook_diagnostic_inputs: {
        Args: {
          available_hours_per_week_value: number | null;
          confidence_entries: Json;
          priority_areas: string[];
          constraint_entries: Json;
          behavioral_stories_coverage_value: string;
          project_deep_dive_coverage_value: string;
        };
        Returns: Database["public"]["Tables"]["interview_playbook_diagnostic_settings"]["Row"];
      };
      save_interview_reminder_preferences: {
        Args: {
          preferred_timezone_value: string | null;
          in_app_enabled_value: boolean;
          prep_3_days_enabled_value: boolean;
          interview_1_day_enabled_value: boolean;
          interview_1_hour_enabled_value: boolean;
          email_enabled_value: boolean;
        };
        Returns: Database["public"]["Tables"]["interview_reminder_preferences"]["Row"];
      };
      save_interview_reminder_preferences_if_revision: {
        Args: {
          target_expect_absent: boolean;
          target_expected_updated_at: string | null;
          preferred_timezone_value: string | null;
          in_app_enabled_value: boolean;
          prep_3_days_enabled_value: boolean;
          interview_1_day_enabled_value: boolean;
          interview_1_hour_enabled_value: boolean;
          email_enabled_value: boolean;
        };
        Returns: { updated_at: string }[];
      };
      complete_account_onboarding: {
        Args: {
          preferred_role_level_value?: "sde1" | "sde2" | "senior" | "staff" | "unsure" | null;
          primary_preparation_focus_value?: "dsa" | "system_design" | "behavioral" | "applications" | "unsure" | null;
          preferred_timezone_value?: string | null;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      save_account_preparation_preferences: {
        Args: {
          preferred_role_level_value: "sde1" | "sde2" | "senior" | "staff" | "unsure" | null;
          primary_preparation_focus_value: "dsa" | "system_design" | "behavioral" | "applications" | "unsure" | null;
          preferred_dsa_level_value: "sde1" | "sde2" | "sde3plus" | null;
        };
        Returns: Database["public"]["Tables"]["user_preparation_preferences"]["Row"];
      };
      record_interview_calendar_export: {
        Args: { target_round_id: string; provider_value: string };
        Returns: boolean;
      };
      consume_account_action_rate_limit: {
        Args: { action_key: "account_export"; max_requests: number; window_seconds: number };
        Returns: { allowed: boolean; retry_after_seconds: number; remaining: number }[];
      };
      claim_due_interview_reminders: {
        Args: { batch_size?: number; worker_time?: string };
        Returns: {
          reminder_id: string;
          claim_token: string;
          reminder_type: "prep_3_days" | "interview_1_day" | "interview_1_hour";
          recipient_email: string;
          round_id: string;
          company_name: string;
          role_title: string;
          round_type: string;
          round_name: string;
          scheduled_at: string;
          timezone: string | null;
          meeting_link: string | null;
        }[];
      };
      validate_interview_reminder_claim: {
        Args: { target_reminder_id: string; target_claim_token: string };
        Returns: boolean;
      };
      mark_interview_reminder_delivered: {
        Args: { target_reminder_id: string; target_claim_token: string; provider_message_id_value?: string | null };
        Returns: boolean;
      };
      fail_interview_reminder_delivery: {
        Args: { target_reminder_id: string; target_claim_token: string; error_code_value: string; retryable_value: boolean };
        Returns: boolean;
      };
      get_public_profile: {
        Args: { profile_username: string };
        Returns: {
          username: string;
          display_name: string | null;
          bio: string | null;
          current_company: string | null;
          current_role: string | null;
          years_experience: number | null;
          linkedin_url: string | null;
          github_url: string | null;
          avatar_url: string | null;
        }[];
      };
      move_interview_round: {
        Args: { target_application_id: string; target_round_id: string; move_direction: string };
        Returns: boolean;
      };
      record_local_system_design_import: {
        Args: { import_version: number };
        Returns: boolean;
      };
      import_dsa_question_progress_if_absent: {
        Args: {
          target_question_id: string;
          target_status: "attempted" | "review";
        };
        Returns: boolean;
      };
      save_dsa_question_progress: {
        Args: {
          target_question_id: string;
          target_status: "not_started" | "attempted" | "solved" | "review";
          target_confidence: "low" | "medium" | "high" | null;
          target_bookmarked: boolean;
          target_notes: string | null;
        };
        Returns: Database["public"]["Tables"]["dsa_question_progress"]["Row"][];
      };
      save_dsa_question_progress_if_revision: {
        Args: {
          target_question_id: string;
          target_expect_absent: boolean;
          target_expected_updated_at: string | null;
          target_status: "not_started" | "attempted" | "solved" | "review";
          target_confidence: "low" | "medium" | "high" | null;
          target_bookmarked: boolean;
          target_notes: string | null;
        };
        Returns: { question_id: string; updated_at: string }[];
      };
      set_dsa_question_quick_progress: {
        Args: {
          target_question_id: string;
          target_status: "not_started" | "attempted" | "solved" | "review" | null;
          target_bookmarked: boolean | null;
        };
        Returns: string;
      };
      import_system_design_item_progress_if_absent: {
        Args: {
          target_item_id: string;
          target_item_type: "concept" | "design_problem";
        };
        Returns: boolean;
      };
      save_system_design_item_progress: {
        Args: {
          target_item_id: string;
          target_item_type: "concept" | "design_problem";
          target_status: "not_started" | "reviewed" | "review" | "comfortable";
          target_confidence: "low" | "medium" | "high" | null;
          target_bookmarked: boolean;
          target_notes: string | null;
        };
        Returns: Database["public"]["Tables"]["system_design_item_progress"]["Row"][];
      };
      save_system_design_item_progress_if_revision: {
        Args: {
          target_item_id: string;
          target_item_type: "concept" | "design_problem";
          target_expect_absent: boolean;
          target_expected_updated_at: string | null;
          target_status: "not_started" | "reviewed" | "review" | "comfortable";
          target_confidence: "low" | "medium" | "high" | null;
          target_bookmarked: boolean;
          target_notes: string | null;
        };
        Returns: { item_id: string; item_type: "concept" | "design_problem"; updated_at: string }[];
      };
      set_system_design_item_quick_progress: {
        Args: {
          target_item_id: string;
          target_item_type: "concept" | "design_problem";
          target_status: "not_started" | "reviewed" | "review" | "comfortable";
        };
        Returns: string;
      };
      create_system_design_attempt: {
        Args: { target_problem_id: string; target_application_id: string | null; target_title: string; target_document: Json };
        Returns: string;
      };
      save_system_design_attempt: {
        Args: {
          target_attempt_id: string;
          target_expected_revision: number;
          target_title: string;
          target_status: "draft" | "practiced" | "review";
          target_confidence: "low" | "medium" | "high" | null;
          target_application_id: string | null;
          target_document: Json;
        };
        Returns: Database["public"]["Tables"]["system_design_attempts"]["Row"][];
      };
      delete_system_design_attempt: { Args: { target_attempt_id: string }; Returns: boolean };
      save_interview_preparation: {
        Args: { target_round_id: string; notes_value?: string | null; completed_ids_value?: string[] | null; topics_asked_value?: string | null; went_well_value?: string | null; needs_improvement_value?: string | null; follow_up_notes_value?: string | null };
        Returns: string;
      };
      set_interview_preparation_checklist_item: {
        Args: { target_round_id: string; target_item_id: string; target_completed: boolean };
        Returns: string;
      };
      add_interview_preparation_task: { Args: { target_round_id: string; title_value: string }; Returns: string };
      toggle_interview_preparation_task: { Args: { target_task_id: string }; Returns: boolean };
      delete_interview_preparation_task: { Args: { target_task_id: string }; Returns: boolean };
      create_behavioral_story_with_themes: {
        Args: {
          target_title: string;
          target_company_or_context: string | null;
          target_role: string | null;
          target_approximate_period: string | null;
          target_project: string | null;
          target_situation: string | null;
          target_task: string | null;
          target_action: string | null;
          target_result: string | null;
          target_reflection: string | null;
          target_short_summary: string | null;
          target_notes: string | null;
          target_themes: string[];
        };
        Returns: { story_id: string; updated_at: string }[];
      };
      update_behavioral_story_with_themes_if_revision: {
        Args: {
          target_story_id: string;
          target_expected_updated_at: string;
          target_title: string;
          target_company_or_context: string | null;
          target_role: string | null;
          target_approximate_period: string | null;
          target_project: string | null;
          target_situation: string | null;
          target_task: string | null;
          target_action: string | null;
          target_result: string | null;
          target_reflection: string | null;
          target_short_summary: string | null;
          target_notes: string | null;
          target_themes: string[];
        };
        Returns: { story_id: string; updated_at: string }[];
      };
      duplicate_behavioral_story_with_themes: {
        Args: { target_story_id: string };
        Returns: { story_id: string; updated_at: string }[];
      };
      create_behavioral_answer_aggregate: {
        Args: {
          target_custom_question_id: string | null;
          target_curated_question_id: string | null;
          target_story_id: string;
          target_company_slug: string | null;
          target_application_id: string | null;
          target_title: string;
          target_answer_text: string;
          target_opening_framing: string | null;
          target_details_to_emphasize: string | null;
          target_details_to_avoid: string | null;
          target_notes: string | null;
          target_status: string;
          target_make_primary: boolean;
        };
        Returns: { answer_id: string; updated_at: string }[];
      };
      update_behavioral_answer_aggregate_if_revision: {
        Args: {
          target_answer_id: string;
          target_expected_updated_at: string;
          target_custom_question_id: string | null;
          target_curated_question_id: string | null;
          target_story_id: string;
          target_company_slug: string | null;
          target_application_id: string | null;
          target_title: string;
          target_answer_text: string;
          target_opening_framing: string | null;
          target_details_to_emphasize: string | null;
          target_details_to_avoid: string | null;
          target_notes: string | null;
          target_status: string;
          target_make_primary: boolean;
        };
        Returns: { answer_id: string; updated_at: string }[];
      };
      replace_behavioral_story_themes: {
        Args: { target_story_id: string; theme_values: string[] };
        Returns: boolean;
      };
      set_behavioral_primary_answer: {
        Args: { target_answer_id: string; make_primary?: boolean };
        Returns: boolean;
      };
      behavioral_story_database_status: {
        Args: {
          story_situation: string | null;
          story_task: string | null;
          story_action: string | null;
          story_result: string | null;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type PublicProfile = Database["public"]["Functions"]["get_public_profile"]["Returns"][number];
export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type InterviewRound = Database["public"]["Tables"]["interview_rounds"]["Row"];
export type InterviewPreparation = Database["public"]["Tables"]["interview_preparations"]["Row"];
export type InterviewPreparationCustomTask = Database["public"]["Tables"]["interview_preparation_custom_tasks"]["Row"];
export type InterviewReminderPreference = Database["public"]["Tables"]["interview_reminder_preferences"]["Row"];
export type InterviewReminder = Database["public"]["Tables"]["interview_reminders"]["Row"];
export type InterviewCalendarExport = Database["public"]["Tables"]["interview_calendar_exports"]["Row"];
export type BehavioralAnswer = Database["public"]["Tables"]["behavioral_answers"]["Row"];
export type BehavioralCustomQuestion = Database["public"]["Tables"]["behavioral_custom_questions"]["Row"];
export type BehavioralSavedQuestion = Database["public"]["Tables"]["behavioral_saved_questions"]["Row"];
export type BehavioralStory = Database["public"]["Tables"]["behavioral_stories"]["Row"];
export type BehavioralStoryQuestionLink = Database["public"]["Tables"]["behavioral_story_question_links"]["Row"];
export type BehavioralStoryTheme = Database["public"]["Tables"]["behavioral_story_themes"]["Row"];
export type UserPreparationPreferenceRow = Database["public"]["Tables"]["user_preparation_preferences"]["Row"];
export type DsaProgressRow = Database["public"]["Tables"]["dsa_progress"]["Row"];
export type DsaQuestionProgressRow = Database["public"]["Tables"]["dsa_question_progress"]["Row"];
export type SystemDesignProgressRow = Database["public"]["Tables"]["system_design_progress"]["Row"];
export type SystemDesignItemProgressRow = Database["public"]["Tables"]["system_design_item_progress"]["Row"];
export type SystemDesignAttemptRow = Database["public"]["Tables"]["system_design_attempts"]["Row"];
export type InterviewPlaybookDiagnosticSettingsRow = Database["public"]["Tables"]["interview_playbook_diagnostic_settings"]["Row"];
export type InterviewPlaybookConfidenceRow = Database["public"]["Tables"]["interview_playbook_confidence"]["Row"];
export type InterviewPlaybookPriorityRow = Database["public"]["Tables"]["interview_playbook_priorities"]["Row"];
export type InterviewPlaybookConstraintRow = Database["public"]["Tables"]["interview_playbook_constraints"]["Row"];
