import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";
import { getSupabaseCredentials } from "@/lib/supabase/env";

export async function createServerSupabaseClient() {
  const credentials = getSupabaseCredentials();

  if (!credentials) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(credentials.url, credentials.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can be read-only for cookies. Supabase refresh still works in middleware.
        }
      },
    },
  });
}
