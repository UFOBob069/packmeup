"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/actions/trips";

/**
 * Permanently deletes the signed-in user's account and associated data.
 * Trips they own cascade via profiles → trips. Memberships and personal data cascade.
 */
export async function deleteAccount(): Promise<{ ok: true }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  if (isDemoMode()) {
    throw new Error("Account deletion is not available in demo mode.");
  }

  const admin = createAdminClient();

  // Remove owned trips explicitly first (clears collaborator access cleanly).
  const { error: tripsError } = await admin.from("trips").delete().eq("owner_id", user.id);
  if (tripsError) throw new Error(tripsError.message);

  // Memberships, gear, group members, profile cascade from auth user / profile.
  const { error: profileError } = await admin.from("profiles").delete().eq("id", user.id);
  if (profileError) throw new Error(profileError.message);

  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) throw new Error(authError.message);

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Session may already be invalid after user deletion.
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  return { ok: true };
}
