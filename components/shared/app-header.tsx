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
      <div className="mx-auto max-w-[90rem] px-4 pt-3 sm:px-6 sm:pt-6 lg:px-8 xl:px-10">
        <div className="surface-strong flex flex-col gap-3 rounded-[1.55rem] border border-white/70 px-3.5 py-3 shadow-[0_22px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-full sm:px-5 sm:py-3">
          <Link href="/" className="flex items-center gap-2.5 self-start sm:gap-3">
            <Logo />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold leading-4 text-slate-950 sm:text-sm">
                ProofPilot
              </div>
              <div className="text-[11px] leading-4 text-slate-500 sm:text-xs">
                Evidence-first complaints
              </div>
            </div>
          </Link>

          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:items-end sm:gap-3">
            {!configured ? (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Badge variant="warning">Needs Supabase env</Badge>
              </div>
            ) : null}

            <nav className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end sm:gap-2">
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
