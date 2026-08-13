export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
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

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
