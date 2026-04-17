"use server";

import { redirect } from "next/navigation";
import { withFlash } from "@/lib/flash";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signupAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(withFlash("/auth/signup", "error", "Email and password are required."));
  }

  if (password.length < 8) {
    redirect(withFlash("/auth/signup", "error", "Password must be at least 8 characters."));
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(withFlash("/auth/signup", "error", "Supabase environment variables are not configured."));
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || null,
      },
    },
  });

  if (error) {
    redirect(withFlash("/auth/signup", "error", error.message));
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirect(
    withFlash(
      "/auth/login",
      "success",
      "Account created. If email confirmation is enabled in Supabase, verify your email before signing in.",
    ),
  );
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(withFlash("/auth/login", "error", "Email and password are required."));
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(withFlash("/auth/login", "error", "Supabase environment variables are not configured."));
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(withFlash("/auth/login", "error", error.message));
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(withFlash("/", "error", "Supabase environment variables are not configured."));
  }

  await supabase.auth.signOut();
  redirect(withFlash("/", "success", "You have been logged out."));
}
