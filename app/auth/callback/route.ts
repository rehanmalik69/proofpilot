import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getSafeNextPath } from "@/lib/auth-url";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getFailureReason(message?: string | null) {
  const normalized = message?.toLowerCase().trim() ?? "";

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid token") ||
    normalized.includes("otp_expired") ||
    normalized.includes("token has expired")
  ) {
    return "expired";
  }

  return "failed";
}

function createRedirect(request: NextRequest, pathname: string, email?: string | null) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";

  if (email) {
    redirectUrl.searchParams.set("email", email);
  }

  return redirectUrl;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const email = searchParams.get("email");
  const next = getSafeNextPath(searchParams.get("next"), "/auth/verified");

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    const fallbackUrl = createRedirect(request, "/auth/verification-error", email);
    fallbackUrl.searchParams.set("reason", "failed");
    return NextResponse.redirect(fallbackUrl);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(createRedirect(request, next, email));
    }

    const fallbackUrl = createRedirect(request, "/auth/verification-error", email);
    fallbackUrl.searchParams.set("reason", getFailureReason(error.message));
    return NextResponse.redirect(fallbackUrl);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(createRedirect(request, next, email));
    }

    const fallbackUrl = createRedirect(request, "/auth/verification-error", email);
    fallbackUrl.searchParams.set("reason", getFailureReason(error.message));
    return NextResponse.redirect(fallbackUrl);
  }

  const fallbackUrl = createRedirect(request, "/auth/verification-error", email);
  fallbackUrl.searchParams.set("reason", "failed");
  return NextResponse.redirect(fallbackUrl);
}
