import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SessionContext = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: User | null;
};

export async function getSessionContext(): Promise<SessionContext> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return { supabase: null, user: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function requireUser() {
  const context = await getSessionContext();

  if (context.supabase && !context.user) {
    redirect("/auth/login?error=Please+sign+in+to+continue.");
  }

  return context;
}
