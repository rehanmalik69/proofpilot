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

function isSessionExchangeRecoveryError(message?: string | null) {
  const normalized = message?.toLowerCase().trim() ?? "";

  return (
    normalized.includes("code verifier") ||
    normalized.includes("bad_code_verifier") ||
    normalized.includes("flow state") ||
    normalized.includes("exchange code") ||
    normalized.includes("auth code") ||
    normalized.includes("pkce")
  );
}

function getFailureReasonFromParams(searchParams: URLSearchParams) {
  const normalized = [
    searchParams.get("error"),
    searchParams.get("error_code"),
    searchParams.get("error_description"),
    searchParams.get("message"),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!normalized) {
    return null;
  }

  return getFailureReason(normalized);
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
  const explicitFailureReason = getFailureReasonFromParams(searchParams);

  if (explicitFailureReason) {
    const fallbackUrl = createRedirect(request, "/auth/verification-error", email);
    fallbackUrl.searchParams.set("reason", explicitFailureReason);
    return NextResponse.redirect(fallbackUrl);
  }

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email_confirmed_at || user?.confirmed_at || isSessionExchangeRecoveryError(error.message)) {
      return NextResponse.redirect(createRedirect(request, next, email ?? user?.email ?? null));
    }

    const fallbackUrl = createRedirect(request, "/auth/verification-error", email);
    fallbackUrl.searchParams.set("reason", getFailureReason(error.message));
    return NextResponse.redirect(fallbackUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email_confirmed_at || user?.confirmed_at) {
    return NextResponse.redirect(createRedirect(request, next, email ?? user.email ?? null));
  }

  const fallbackUrl = createRedirect(request, "/auth/verification-error", email);
  fallbackUrl.searchParams.set("reason", "failed");
  return NextResponse.redirect(fallbackUrl);
}
