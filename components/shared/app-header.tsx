import Link from "next/link";
import { FileText, LayoutDashboard, Plus, Wrench } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { getSessionContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";

export async function AppHeader() {
  const [{ user }, configured] = await Promise.all([
    getSessionContext(),
    Promise.resolve(isSupabaseConfigured()),
  ]);

  return (
    <header className="relative z-20">
      <div className="mx-auto max-w-[88rem] px-5 pt-5 sm:px-8 sm:pt-6 lg:px-10">
        <div className="surface-strong flex flex-col gap-4 rounded-[1.8rem] border border-white/70 px-4 py-4 shadow-[0_22px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:rounded-full sm:px-5 sm:py-3">
          <Link href="/" className="flex items-center gap-3 self-start">
            <Logo />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-950">ProofPilot</div>
              <div className="text-xs text-slate-500">Evidence-first complaints</div>
            </div>
          </Link>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            {!configured ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="warning">Needs Supabase env</Badge>
              </div>
            ) : null}

            <nav className="flex flex-wrap items-center gap-2 sm:justify-end">
              {user ? (
                <>
                  <ButtonLink href="/dashboard" variant="ghost" size="sm">
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </ButtonLink>
                  <ButtonLink href="/cases/new" variant="secondary" size="sm">
                    <Plus className="size-4" />
                    New case
                  </ButtonLink>
                  <form action={logoutAction}>
                    <Button type="submit" variant="ghost" size="sm">
                      Logout
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  {configured ? (
                    <>
                      <ButtonLink href="/auth/login" variant="ghost" size="sm">
                        Sign in
                      </ButtonLink>
                      <ButtonLink href="/auth/signup" size="sm">
                        <FileText className="size-4" />
                        Start free
                      </ButtonLink>
                    </>
                  ) : (
                    <ButtonLink href="/#setup" size="sm">
                      <Wrench className="size-4" />
                      Finish setup
                    </ButtonLink>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
