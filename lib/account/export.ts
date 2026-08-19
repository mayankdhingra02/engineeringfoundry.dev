import "server-only";

import type { AuthenticatedActor } from "@/lib/auth/actor";
import { collectAccountExportRows } from "./export-pagination";

const EXPORT_VERSION = "1.1";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }, section: string): T {
  if (result.error) throw new Error(`Account export query failed: ${section}`);
  return result.data as T;
}

export async function buildAccountExport(actor: AuthenticatedActor) {
  const userId = actor.user.id;
  const [profileResult, preparationPreferencesResult, interviewPreferencesResult, playbookDiagnosticSettingsResult, applications, interviewRounds, interviewPreparations, interviewPreparationTasks, customQuestions, stories, storyThemes, storyQuestionLinks, answers, savedQuestions, dsaProgress, dsaQuestionProgress, systemDesignProgress, systemDesignItemProgress, systemDesignAttempts, reminders, calendarExports, playbookConfidence, playbookPriorities, playbookConstraints] = await Promise.all([
    actor.supabase.from("profiles").select("username,display_name,bio,current_company,current_role,years_experience,linkedin_url,github_url,avatar_url,is_public,onboarding_complete,onboarding_completed_at,created_at,updated_at").eq("id", userId).maybeSingle(),
    actor.supabase.from("user_preparation_preferences").select("dsa_level,dsa_plan_id,dsa_company_slug,dsa_preferred_language_slug,dsa_interview_date,system_design_level,system_design_preparation_window,system_design_role,system_design_minutes_per_day,preferred_role_level,primary_preparation_focus,created_at,updated_at").eq("user_id", userId).maybeSingle(),
    actor.supabase.from("interview_reminder_preferences").select("preferred_timezone,in_app_enabled,prep_3_days_enabled,interview_1_day_enabled,interview_1_hour_enabled,email_enabled,created_at,updated_at").eq("user_id", userId).maybeSingle(),
    actor.supabase.from("interview_playbook_diagnostic_settings").select("available_hours_per_week,behavioral_stories_coverage,project_deep_dive_coverage,created_at,updated_at").eq("user_id", userId).maybeSingle(),
    collectAccountExportRows("applications", (from, to) => actor.supabase.from("applications").select("id,company_name,company_slug,company_logo_url,role_title,role_level,location,job_url,application_date,source,status,recruiter_name,recruiter_email,notes,created_at,updated_at").eq("user_id", userId).order("created_at").order("id").range(from, to)),
    collectAccountExportRows("interview_rounds", (from, to) => actor.supabase.from("interview_rounds").select("id,application_id,round_number,round_name,round_type,scheduled_at,duration_minutes,timezone,interviewer_name,interviewer_role,meeting_link,location,status,result,notes,created_at,updated_at").eq("user_id", userId).order("created_at").order("id").range(from, to)),
    collectAccountExportRows("interview_preparations", (from, to) => actor.supabase.from("interview_preparations").select("id,round_id,private_notes,completed_template_item_ids,topics_asked,went_well,needs_improvement,follow_up_notes,created_at,updated_at").eq("user_id", userId).order("created_at").order("id").range(from, to)),
    collectAccountExportRows("interview_preparation_tasks", (from, to) => actor.supabase.from("interview_preparation_custom_tasks").select("id,round_id,title,completed,position,created_at,updated_at").eq("user_id", userId).order("created_at").order("id").range(from, to)),
    collectAccountExportRows("behavioral_custom_questions", (from, to) => actor.supabase.from("behavioral_custom_questions").select("id,question_text,description,category,company_slug,notes,created_at,updated_at").eq("user_id", userId).order("created_at").order("id").range(from, to)),
    collectAccountExportRows("behavioral_stories", (from, to) => actor.supabase.from("behavioral_stories").select("id,title,company_or_context,role,approximate_period,project,situation,task,action,result,reflection,short_summary,status,notes,created_at,updated_at").eq("user_id", userId).order("created_at").order("id").range(from, to)),
    collectAccountExportRows("behavioral_story_themes", (from, to) => actor.supabase.from("behavioral_story_themes").select("id,story_id,theme,created_at").eq("user_id", userId).order("created_at").order("id").range(from, to)),
    collectAccountExportRows("behavioral_story_question_links", (from, to) => actor.supabase.from("behavioral_story_question_links").select("id,story_id,custom_question_id,curated_question_id,relevance,notes,created_at").eq("user_id", userId).order("created_at").order("id").range(from, to)),
    collectAccountExportRows("behavioral_answers", (from, to) => actor.supabase.from("behavioral_answers").select("id,custom_question_id,curated_question_id,story_id,company_slug,application_id,title,opening_framing,details_to_emphasize,details_to_avoid,answer_text,notes,status,is_primary,created_at,updated_at").eq("user_id", userId).order("created_at").order("id").range(from, to)),
    collectAccountExportRows("behavioral_saved_questions", (from, to) => actor.supabase.from("behavioral_saved_questions").select("id,custom_question_id,curated_question_id,created_at").eq("user_id", userId).order("created_at").order("id").range(from, to)),
    collectAccountExportRows("dsa_progress", (from, to) => actor.supabase.from("dsa_progress").select("item_kind,item_id,status,created_at,updated_at").eq("user_id", userId).order("created_at").order("item_kind").order("item_id").range(from, to)),
    collectAccountExportRows("dsa_question_progress", (from, to) => actor.supabase.from("dsa_question_progress").select("question_id,status,confidence,bookmarked,notes,first_attempted_at,last_practiced_at,solved_at,created_at,updated_at").eq("user_id", userId).order("created_at").order("question_id").range(from, to)),
    collectAccountExportRows("system_design_progress", (from, to) => actor.supabase.from("system_design_progress").select("item_kind,item_id,status,completed_at,last_interacted_at,created_at,updated_at").eq("user_id", userId).order("created_at").order("item_kind").order("item_id").range(from, to)),
    collectAccountExportRows("system_design_item_progress", (from, to) => actor.supabase.from("system_design_item_progress").select("item_id,item_type,status,confidence,bookmarked,notes,first_reviewed_at,last_practiced_at,created_at,updated_at").eq("user_id", userId).order("created_at").order("item_type").order("item_id").range(from, to)),
    collectAccountExportRows("system_design_attempts", (from, to) => actor.supabase.from("system_design_attempts").select("id,problem_id,application_id,title,status,confidence,document,revision,first_practiced_at,last_practiced_at,created_at,updated_at").eq("user_id", userId).order("created_at").order("id").range(from, to)),
    collectAccountExportRows("interview_reminders", (from, to) => actor.supabase.from("interview_reminders").select("id,round_id,reminder_type,channel,scheduled_for,status,delivered_at,cancelled_at,created_at,updated_at").eq("user_id", userId).order("scheduled_for").order("id").range(from, to)),
    collectAccountExportRows("interview_calendar_exports", (from, to) => actor.supabase.from("interview_calendar_exports").select("round_id,provider,exported_revision,export_count,first_exported_at,last_exported_at").eq("user_id", userId).order("first_exported_at").order("round_id").range(from, to)),
    collectAccountExportRows("interview_playbook_confidence", (from, to) => actor.supabase.from("interview_playbook_confidence").select("area,confidence,created_at,updated_at").eq("user_id", userId).order("area").range(from, to)),
    collectAccountExportRows("interview_playbook_priorities", (from, to) => actor.supabase.from("interview_playbook_priorities").select("area,position,created_at,updated_at").eq("user_id", userId).order("position").range(from, to)),
    collectAccountExportRows("interview_playbook_constraints", (from, to) => actor.supabase.from("interview_playbook_constraints").select("id,category,description,position,created_at,updated_at").eq("user_id", userId).order("position").range(from, to)),
  ]);

  const profile = unwrap(profileResult, "profile");
  const preparationPreferences = unwrap(preparationPreferencesResult, "preparation_preferences");
  const interviewPreferences = unwrap(interviewPreferencesResult, "interview_preferences");
  const playbookDiagnosticSettings = unwrap(playbookDiagnosticSettingsResult, "interview_playbook_diagnostic_settings");

  return {
    export_version: EXPORT_VERSION,
    generated_at: new Date().toISOString(),
    account: {
      email: actor.user.email ?? null,
      email_confirmed_at: actor.user.email_confirmed_at ?? null,
      created_at: actor.user.created_at,
      profile,
      preparation_preferences: preparationPreferences,
      interview_preferences: interviewPreferences,
    },
    applications,
    interview_rounds: interviewRounds,
    interview_preparation: {
      records: interviewPreparations,
      custom_tasks: interviewPreparationTasks,
    },
    behavioral: {
      custom_questions: customQuestions,
      stories,
      story_themes: storyThemes,
      story_question_links: storyQuestionLinks,
      answers,
      saved_questions: savedQuestions,
    },
    dsa: {
      roadmap_progress: dsaProgress,
      question_progress: dsaQuestionProgress,
    },
    system_design: {
      learning_progress: systemDesignProgress,
      item_progress: systemDesignItemProgress,
      attempts: systemDesignAttempts,
    },
    calendar: {
      reminders,
      exports: calendarExports,
    },
    interview_playbook: {
      diagnostic_settings: playbookDiagnosticSettings,
      confidence: playbookConfidence,
      priorities: playbookPriorities,
      constraints: playbookConstraints,
    },
  };
}
