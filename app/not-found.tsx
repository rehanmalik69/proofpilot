import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center px-6 py-16 sm:px-8">
      <div className="surface w-full rounded-[2rem] border border-white/80 p-10 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.28em] text-slate-400">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
          Case not found
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
          The case you are looking for does not exist or you do not have access to it.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
          <Link
            href="/cases/new"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Create a case
          </Link>
        </div>
      </div>
    </div>
  );
}
