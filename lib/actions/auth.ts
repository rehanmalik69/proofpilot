"use server";

import { redirect } from "next/navigation";
import type { NoticeTone } from "@/lib/types/domain";
import { withFlash } from "@/lib/flash";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CredentialsInput = {
  email: string;
  password: string;
};

type SignupInput = CredentialsInput & {
  fullName?: string;
};

type VerificationInput = {
  email: string;
};

export type AuthActionNotice = {
  tone: NoticeTone;
  message: string;
  detail?: string;
};

export type LoginActionResult = {
  status: "idle" | "error" | "verification_required" | "success";
  email?: string;
  notice?: AuthActionNotice | null;
};

export type SignupActionResult = {
  status: "idle" | "error" | "pending_verification" | "authenticated";
  email?: string;
  notice?: AuthActionNotice | null;
};

export type VerificationResendResult = {
  status: "idle" | "error" | "success";
  email?: string;
  notice?: AuthActionNotice | null;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function createNotice(
  tone: NoticeTone,
  message: string,
  detail?: string,
): AuthActionNotice {
  return { tone, message, detail };
}

function isUnverifiedEmailError(message?: string | null) {
  const normalized = message?.toLowerCase().trim() ?? "";

  return (
    normalized.includes("email not confirmed") ||
    normalized.includes("email not verified") ||
    normalized.includes("confirm your email") ||
    normalized.includes("verify your email")
  );
}

function isRateLimitedError(message?: string | null) {
  const normalized = message?.toLowerCase().trim() ?? "";

  return (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("security purposes")
  );
}

function getFriendlyLoginError(message?: string | null) {
  const normalized = message?.toLowerCase().trim() ?? "";

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password") ||
    normalized.includes("invalid credentials")
  ) {
    return createNotice(
      "error",
      "We couldn’t sign you in with those details. Double-check your email and password, then try again.",
    );
  }

  return createNotice(
    "error",
    "We couldn’t sign you in right now. Please try again in a moment.",
  );
}

function getFriendlySignupError(message?: string | null) {
  const normalized = message?.toLowerCase().trim() ?? "";

  if (normalized.includes("already registered") || normalized.includes("user already exists")) {
    return createNotice(
      "warning",
      "An account already exists for this email. Sign in instead or use a different email.",
    );
  }

  return createNotice(
    "error",
    "We couldn’t create your account right now. Please try again in a moment.",
  );
}

function getResendFailureNotice(message?: string | null) {
  if (isRateLimitedError(message)) {
    return createNotice(
      "warning",
      "We could not resend the verification email. Please try again in a moment.",
      "Too many resend requests were made recently. Wait a moment before trying again.",
    );
  }

  return createNotice(
    "warning",
    "We could not resend the verification email. Please try again in a moment.",
  );
}

async function getSupabaseOrError() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      supabase: null,
      notice: createNotice(
        "error",
        "Supabase environment variables are not configured.",
      ),
    };
  }

  return { supabase, notice: null };
}

export async function signupAction({
  fullName = "",
  email,
  password,
}: SignupInput): Promise<SignupActionResult> {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return {
      status: "error",
      email: normalizedEmail,
      notice: createNotice("error", "Email and password are required."),
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      email: normalizedEmail,
      notice: createNotice("error", "Password must be at least 8 characters."),
    };
  }

  const { supabase, notice } = await getSupabaseOrError();

  if (!supabase) {
    return { status: "error", email: normalizedEmail, notice };
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: fullName.trim() || null,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      email: normalizedEmail,
      notice: getFriendlySignupError(error.message),
    };
  }

  if (data.session) {
    return { status: "authenticated", email: normalizedEmail, notice: null };
  }

  return {
    status: "pending_verification",
    email: normalizedEmail,
    notice: null,
  };
}

export async function loginAction({
  email,
  password,
}: CredentialsInput): Promise<LoginActionResult> {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return {
      status: "error",
      email: normalizedEmail,
      notice: createNotice("error", "Email and password are required."),
    };
  }

  const { supabase, notice } = await getSupabaseOrError();

  if (!supabase) {
    return { status: "error", email: normalizedEmail, notice };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    if (isUnverifiedEmailError(error.message)) {
      return {
        status: "verification_required",
        email: normalizedEmail,
        notice: null,
      };
    }

    return {
      status: "error",
      email: normalizedEmail,
      notice: getFriendlyLoginError(error.message),
    };
  }

  return { status: "success", email: normalizedEmail, notice: null };
}

export async function resendVerificationEmailAction({
  email,
}: VerificationInput): Promise<VerificationResendResult> {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return {
      status: "error",
      email: normalizedEmail,
      notice: createNotice(
        "warning",
        "We could not resend the verification email. Please try again in a moment.",
        "Use a different email if the address above is incorrect.",
      ),
    };
  }

  const { supabase, notice } = await getSupabaseOrError();

  if (!supabase) {
    return { status: "error", email: normalizedEmail, notice };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalizedEmail,
  });

  if (error) {
    return {
      status: "error",
      email: normalizedEmail,
      notice: getResendFailureNotice(error.message),
    };
  }

  return {
    status: "success",
    email: normalizedEmail,
    notice: createNotice(
      "success",
      "Verification email sent successfully.",
      `Please check your inbox for ${normalizedEmail}.`,
    ),
  };
}

export async function recheckVerificationAction({
  email,
  password,
}: CredentialsInput): Promise<LoginActionResult> {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return {
      status: "error",
      email: normalizedEmail,
      notice: createNotice(
        "warning",
        "Enter your password again to continue signing in after verification.",
      ),
    };
  }

  const { supabase, notice } = await getSupabaseOrError();

  if (!supabase) {
    return { status: "error", email: normalizedEmail, notice };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    if (isUnverifiedEmailError(error.message)) {
      return {
        status: "verification_required",
        email: normalizedEmail,
        notice: createNotice(
          "warning",
          "Your email is still not verified. Please open the verification link from your inbox, then try again.",
        ),
      };
    }

    return {
      status: "error",
      email: normalizedEmail,
      notice: getFriendlyLoginError(error.message),
    };
  }

  return { status: "success", email: normalizedEmail, notice: null };
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(withFlash("/", "error", "Supabase environment variables are not configured."));
  }

  await supabase.auth.signOut();
  redirect(withFlash("/", "success", "You have been logged out."));
}
