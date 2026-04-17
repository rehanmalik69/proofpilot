import { getSessionContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function Home() {
  const { user } = await getSessionContext();

  return (
    <LandingPage
      configured={isSupabaseConfigured()}
      hasUser={Boolean(user)}
    />
  );
}
