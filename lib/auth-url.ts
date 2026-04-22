import { headers } from "next/headers";

function normalizeOrigin(value?: string | null) {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.replace(/\/+$/, "");
  }

  return `https://${value.replace(/\/+$/, "")}`;
}

function sanitizePath(pathname?: string | null) {
  if (!pathname || !pathname.startsWith("/")) {
    return null;
  }

  return pathname;
}

export async function getAppOrigin() {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");
  const forwardedProto = headerStore.get("x-forwarded-proto");

  if (host) {
    const protocol =
      forwardedProto ?? (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

    return `${protocol}://${host}`;
  }

  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeOrigin(process.env.VERCEL_URL)
  );
}

export async function getVerificationEmailRedirect(email: string) {
  const origin = await getAppOrigin();

  if (!origin) {
    return null;
  }

  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", "/auth/verified");
  callbackUrl.searchParams.set("email", email);
  return callbackUrl.toString();
}

export function getSafeNextPath(value?: string | null, fallback = "/auth/verified") {
  return sanitizePath(value) ?? fallback;
}
