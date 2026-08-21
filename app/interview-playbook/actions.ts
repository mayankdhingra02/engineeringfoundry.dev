"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { parseInterviewPlaybookDiagnosticInputForm } from "@/lib/interview-playbook/diagnostic-input-form.ts";
import { saveInterviewPlaybookDiagnosticInputsForActor } from "@/lib/interview-playbook/diagnostic-inputs.ts";

function mutationFailure(message: string): never {
  throw new Error(message);
}

function signInAgain(): never {
  redirect(`/signin?next=${encodeURIComponent("/interview-playbook")}`);
}

/**
 * The only write path for Phase 3B1 diagnostic inputs. The actor's id never
 * comes from `formData` — it is always resolved from the authenticated
 * session, and the underlying RPC re-derives ownership from `auth.uid()`
 * independently of anything this action sends. Free-text constraint
 * descriptions are forwarded to the database only; they are never logged or
 * sent to analytics.
 */
export async function saveInterviewPlaybookDiagnosticInputs(formData: FormData): Promise<void> {
  const actor = await getAuthenticatedActor();
  if (!actor) signInAgain();

  const parsed = parseInterviewPlaybookDiagnosticInputForm(formData);
  if (!parsed.ok) mutationFailure(parsed.error);

  const result = await saveInterviewPlaybookDiagnosticInputsForActor(actor, parsed.value);
  if (!result.ok) mutationFailure("We couldn't save your diagnostic inputs. Review the values and try again.");

  revalidatePath("/interview-playbook");
}
