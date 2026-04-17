import type { NoticeTone } from "@/lib/types/domain";

type SearchParamValue = string | string[] | undefined;
type SearchParamRecord = Record<string, SearchParamValue>;

export async function getFlashMessage(
  searchParams?: Promise<SearchParamRecord> | SearchParamRecord,
) {
  const params = searchParams ? await searchParams : {};

  const priority: NoticeTone[] = ["error", "success", "info"];

  for (const tone of priority) {
    const value = params[tone];
    if (typeof value === "string" && value.length > 0) {
      return { tone, message: value };
    }
  }

  return null;
}

export function withFlash(pathname: string, tone: NoticeTone, message: string) {
  const params = new URLSearchParams();
  params.set(tone, message);
  return `${pathname}?${params.toString()}`;
}
