"use server";

import { revalidatePath } from "next/cache";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import {
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_CONFLICT_ERROR,
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_PERSISTENCE_ERROR,
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_SAVED_MESSAGE,
  parseInterviewPlaybookDiagnosticInputForm,
} from "@/lib/interview-playbook/diagnostic-input-form.ts";
import { saveInterviewPlaybookDiagnosticInputsForActor } from "@/lib/interview-playbook/diagnostic-inputs.ts";

export type InterviewPlaybookDiagnosticActionState = Readonly<{
  status: "idle" | "error" | "success";
  message: string;
  conflict?: boolean;
  revision?: string;
}>;

/**
 * The only write path for Phase 3B1 diagnostic inputs. The actor's id never
 * comes from `formData` — it is always resolved from the authenticated
 * session, and the underlying RPC re-derives ownership from `auth.uid()`
 * independently of anything this action sends. Free-text constraint
 * descriptions are forwarded to the database only; they are never logged or
 * sent to analytics.
 */
export async function saveInterviewPlaybookDiagnosticInputs(
  previousState: InterviewPlaybookDiagnosticActionState,
  formData: unknown,
): Promise<InterviewPlaybookDiagnosticActionState> {
  const parsed = parseInterviewPlaybookDiagnosticInputForm(formData);
  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.error,
      revision: previousState.revision,
    };
  }

  const input = parsed.value;
  const failed = (message: string, conflict = false) => ({
    status: "error" as const,
    message,
    conflict,
    revision: input.revision,
  });
  if (!isAccountPlatformAvailable()) {
    return failed("Account persistence is not available in this configuration.");
  }
  const actor = await getAuthenticatedActor();
  if (!actor) return failed("Your session expired. Sign in and try again.");

  const result = await saveInterviewPlaybookDiagnosticInputsForActor(
    actor,
    input,
  );
  if (result.status === "conflict") {
    return failed(INTERVIEW_PLAYBOOK_DIAGNOSTIC_CONFLICT_ERROR, true);
  }
  if (result.status === "error") {
    return failed(INTERVIEW_PLAYBOOK_DIAGNOSTIC_PERSISTENCE_ERROR);
  }

  revalidatePath("/interview-playbook");
  return {
    status: "success",
    message: INTERVIEW_PLAYBOOK_DIAGNOSTIC_SAVED_MESSAGE,
    revision: result.updatedAt,
  };
}
