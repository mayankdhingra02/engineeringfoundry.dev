"use server";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PasswordActionState { status: "idle" | "error" | "success"; message: string; }
export const initialPasswordState: PasswordActionState = { status: "idle", message: "" };

export async function updatePasswordAction(_: PasswordActionState, formData: FormData): Promise<PasswordActionState> {
  const cookieStore = await cookies();
  if (cookieStore.get("ef-password-recovery")?.value !== "1") return { status: "error", message: "This recovery session is invalid or expired. Request a new reset link." };
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirm_password") ?? "");
  if (password.length < 8) return { status: "error", message: "Use a password with at least 8 characters." };
  if (password !== confirmation) return { status: "error", message: "Passwords do not match." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Password recovery is not configured in this environment." };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: "error", message: "This recovery session is invalid or expired. Request a new reset link." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: "error", message: "We couldn't update your password. Request a new reset link and try again." };
  cookieStore.delete("ef-password-recovery");
  return { status: "success", message: "Password updated." };
}
