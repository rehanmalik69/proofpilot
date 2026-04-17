"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  FileSearch,
  FileStack,
  FolderKanban,
  Gauge,
  MessageSquareQuote,
  ReceiptText,
  Scale,
  ShieldCheck,
  WandSparkles,
} from "lucide-react";
import { SetupRequired } from "@/components/shared/setup-required";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/reveal";
import { SectionHeading } from "@/components/marketing/section-heading";

type LandingPageProps = {
  configured: boolean;
  hasUser: boolean;
};

const trustChips = [
  "Chargebacks",
  "Denied refunds",
  "Merchant disputes",
  "Small consumer claims",
];

const whyCards = [
  {
    icon: FolderKanban,
    title: "One case room per dispute",
    body: "Every merchant, amount, date, file, and generated summary stays attached to a single case thread instead of getting lost across tabs.",
  },
  {
    icon: BrainCircuit,
    title: "AI summaries with structure",
    body: "The app does not just dump text. It produces a usable timeline, extracted facts, missing-proof list, and a complaint draft.",
  },
  {
    icon: Gauge,
    title: "Built for demo credibility",
    body: "The surface looks like a real startup product, while the architecture stays practical for a GenAI hackathon MVP.",
  },
];

const howItWorks = [
  {
    step: "01",
    icon: ReceiptText,
    title: "Open a case",
    body: "Capture the dispute title, merchant, issue description, amount, and date in a structured intake flow.",
  },
  {
    step: "02",
    icon: FileSearch,
    title: "Attach proof",
    body: "Upload receipts, screenshots, PDFs, support emails, statements, and delivery evidence to one evidence panel.",
  },
  {
    step: "03",
    icon: WandSparkles,
    title: "Generate the complaint pack",
    body: "ProofPilot turns the material into a coherent timeline and a cleaner complaint narrative with actionable gaps called out.",
  },
];

const structuredOutputs = [
  {
    title: "Timeline",
    accent: "from-blue-500/20 to-blue-50",
    icon: FileStack,
    lines: [
      "Mar 2, 2026 - Damaged order delivered",
      "Mar 4, 2026 - Merchant acknowledged defect",
      "Mar 9, 2026 - Refund still not issued",
    ],
  },
  {
    title: "Extracted facts",
    accent: "from-emerald-500/18 to-emerald-50",
    icon: BadgeCheck,
    lines: [
      "Merchant: Northline Retail",
      "Amount in dispute: $184.00",
      "Status: merchant aware, resolution incomplete",
    ],
  },
  {
    title: "Missing evidence",
    accent: "from-amber-500/20 to-amber-50",
    icon: ShieldCheck,
    lines: [
      "Bank statement excerpt",
      "Final refusal or no-response screenshot",
      "Photo tied to delivery date metadata",
    ],
  },
  {
    title: "Complaint draft",
    accent: "from-slate-900/12 to-white",
    icon: MessageSquareQuote,
    lines: [
      "I am requesting a refund for a damaged order...",
      "The merchant acknowledged the issue but has not completed the promised resolution.",
      "Please confirm the review outcome in writing.",
    ],
  },
];

function heroPrimary(configured: boolean, hasUser: boolean) {
  if (!configured) {
    return { href: "#setup", label: "Connect Supabase" };
  }

  if (hasUser) {
    return { href: "/dashboard", label: "Open dashboard" };
  }

  return { href: "/auth/signup", label: "Start a case" };
}

function heroSecondary(configured: boolean) {
  return configured
    ? { href: "/auth/login", label: "Sign in" }
    : { href: "#preview", label: "See live preview" };
}

export function LandingPage({ configured, hasUser }: LandingPageProps) {
  const reducedMotion = useReducedMotion();
  const primary = heroPrimary(configured, hasUser);
  const secondary = heroSecondary(configured);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-7xl flex-col gap-10 px-6 pb-20 pt-8 sm:px-8 lg:px-10">
      <section className="relative grid gap-7 lg:grid-cols-[1fr_0.98fr]">
        <Reveal className="surface-strong relative overflow-hidden rounded-[2rem] border border-white/70 p-8 sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_36%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0.64))]" />
          <div className="absolute -right-18 top-20 size-52 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -left-10 bottom-12 size-40 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative z-10 space-y-8">
            <Badge variant="info" className="rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.28em]">
              Premium complaint intelligence workspace
            </Badge>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
                Turn a messy dispute into a boardroom-ready complaint file.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                ProofPilot helps users organize evidence for consumer complaints, map the proof
                chain, and generate structured AI outputs that look credible in front of merchants,
                banks, and review panels.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.div whileHover={reducedMotion ? undefined : { y: -3 }} whileTap={reducedMotion ? undefined : { scale: 0.99 }}>
                <ButtonLink href={primary.href} size="lg" className="min-w-44">
                  {primary.label}
                  <ArrowRight className="size-4" />
                </ButtonLink>
              </motion.div>
              <motion.div whileHover={reducedMotion ? undefined : { y: -3 }} whileTap={reducedMotion ? undefined : { scale: 0.99 }}>
                <ButtonLink href={secondary.href} variant="secondary" size="lg" className="min-w-40">
                  {secondary.label}
                </ButtonLink>
              </motion.div>
            </div>

            <div className="flex flex-wrap gap-3">
              {trustChips.map((chip, index) => (
                <motion.div
                  key={chip}
                  initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={reducedMotion ? undefined : { delay: 0.12 + index * 0.06, duration: 0.42 }}
                  className="rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                >
                  {chip}
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="relative overflow-hidden rounded-[2rem] border border-slate-900/80 bg-[linear-gradient(180deg,#08111f_0%,#0d1830_44%,#132347_100%)] p-5 shadow-[0_38px_100px_rgba(15,23,42,0.28)] sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_22%)]" />
          <div className="relative z-10 rounded-[1.7rem] border border-white/10 bg-white/6 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.28em] text-slate-400">
                  Product preview
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Evidence control room
                </h2>
              </div>
              <div className="rounded-full border border-blue-400/20 bg-blue-400/12 px-3 py-1 text-xs font-semibold text-blue-100">
                AI summary active
              </div>
            </div>

            <div
              id="preview"
              className="mt-6 grid gap-4 lg:grid-cols-[0.34fr_0.66fr]"
            >
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-3 text-sm text-blue-100">
                    Case brief
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-sm text-slate-300">
                    Evidence
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-sm text-slate-300">
                    Timeline
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-sm text-slate-300">
                    Complaint draft
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                  <motion.div
                    whileHover={reducedMotion ? undefined : { y: -4 }}
                    className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(37,99,235,0.26),rgba(15,23,42,0.78))] p-5"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.24em] text-slate-300">
                      <Scale className="size-4 text-amber-300" />
                      Dispute strength
                    </div>
                    <div className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white">
                      $184.00
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-200">
                      Merchant acknowledged the issue. Refund remains incomplete. Escalation path is supported by attached evidence.
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={reducedMotion ? undefined : { y: -4 }}
                    className="rounded-[1.5rem] border border-white/12 bg-white p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-400">
                        Evidence stack
                      </div>
                      <Badge variant="ghost">6 files</Badge>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        Order receipt and invoice
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        Delivery photos with damage
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        Merchant support email thread
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  whileHover={reducedMotion ? undefined : { y: -4 }}
                  className="rounded-[1.5rem] border border-white/10 bg-white/7 p-5"
                >
                  <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-400">
                        Timeline signal
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200">
                          Mar 2 - Damaged order delivered
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200">
                          Mar 4 - Merchant confirmed replacement or refund
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200">
                          Mar 9 - No refund posted, case escalated
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.4rem] border border-emerald-300/18 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(255,255,255,0.02))] p-4">
                      <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-emerald-200">
                        Draft complaint
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-200">
                        I am requesting a full refund for a damaged order. The merchant acknowledged
                        the defect but has not completed the promised resolution within a reasonable timeframe.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {!configured ? (
        <Reveal className="pt-1">
          <section id="setup">
            <SetupRequired />
          </section>
        </Reveal>
      ) : null}

      <section id="why" className="rounded-[2rem] border border-slate-900/80 bg-[linear-gradient(180deg,#0c1527_0%,#13223d_100%)] px-8 py-10 text-white shadow-[0_40px_100px_rgba(15,23,42,0.22)] sm:px-10 sm:py-12">
        <Reveal>
          <SectionHeading
            label="Why ProofPilot"
            title="A premium complaint workflow built around the proof chain."
            description="The product is designed to feel serious on demo day: evidence-first, structured, and visibly more mature than a generic CRUD dashboard with AI sprinkled on top."
            inverse
          />
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {whyCards.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={0.04 * index}>
              <motion.div whileHover={reducedMotion ? undefined : { y: -6 }}>
                <Card className="h-full border-white/10 bg-white/6 text-white shadow-none">
                  <CardHeader className="gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-blue-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-2xl text-white">{title}</CardTitle>
                    <p className="text-sm leading-7 text-slate-300">{body}</p>
                  </CardHeader>
                </Card>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="surface-strong rounded-[2rem] border border-white/70 px-8 py-10 sm:px-10 sm:py-12">
        <Reveal>
          <SectionHeading
            label="How it works"
            title="A simple flow that still feels like a real AI SaaS."
            description="The interaction model is easy to explain in a hackathon demo: create a case, attach evidence, then turn that record into structured AI output."
          />
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {howItWorks.map(({ step, icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={0.05 * index}>
              <motion.div whileHover={reducedMotion ? undefined : { y: -5 }}>
                <Card className="h-full border-white/70 bg-white/88 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                  <CardHeader className="gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white shadow-[0_14px_30px_rgba(37,99,235,0.2)]">
                        <Icon className="size-5" />
                      </div>
                      <div className="text-[11px] font-mono uppercase tracking-[0.28em] text-slate-400">
                        {step}
                      </div>
                    </div>
                    <CardTitle className="text-2xl text-slate-950">{title}</CardTitle>
                    <p className="text-sm leading-7 text-slate-600">{body}</p>
                  </CardHeader>
                </Card>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="outputs" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <div className="surface-strong h-full rounded-[2rem] border border-white/70 p-8 sm:p-10">
            <SectionHeading
              label="Sample structured outputs"
              title="What users actually get back from the AI layer."
              description="This section shows the output style the product is built around: not vague prose, but clean blocks that help users understand what happened, what is missing, and what to send next."
            />
            <div className="mt-8 rounded-[1.7rem] border border-slate-200 bg-[linear-gradient(180deg,#0f172a,#15233a)] p-5 text-white">
              <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-400">
                Output philosophy
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                ProofPilot is strongest when the summary reads like a case analyst prepared it:
                calm tone, factual wording, clear issue framing, and zero fluffy LLM filler.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          {structuredOutputs.map(({ title, accent, icon: Icon, lines }, index) => (
            <Reveal key={title} delay={0.04 * index}>
              <motion.div whileHover={reducedMotion ? undefined : { y: -5 }}>
                <Card className={`h-full overflow-hidden border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.84))] shadow-[0_20px_50px_rgba(15,23,42,0.07)]`}>
                  <CardHeader className="gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-slate-950 ring-1 ring-slate-200/80`}>
                        <Icon className="size-5" />
                      </div>
                      <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-400">
                        Output block
                      </div>
                    </div>
                    <CardTitle className="text-2xl text-slate-950">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lines.map((line) => (
                      <div
                        key={line}
                        className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-7 text-slate-700"
                      >
                        {line}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-slate-900/80 bg-[linear-gradient(135deg,#08111f_0%,#11203a_54%,#1d4ed8_120%)] px-8 py-10 text-white shadow-[0_40px_100px_rgba(15,23,42,0.24)] sm:px-10 sm:py-12">
        <div className="absolute -right-10 top-0 size-56 rounded-full bg-blue-400/18 blur-3xl" />
        <div className="absolute left-16 bottom-0 size-44 rounded-full bg-sky-300/12 blur-3xl" />

        <Reveal className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-white/12 bg-white/8 px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.28em] text-slate-300">
              Final CTA
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Show a real AI product, not a basic form demo with a logo on top.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200">
              ProofPilot is positioned to demo well: evidence upload flow, structured AI output,
              premium UI, and a believable legal-tech use case with a clear path to production.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <motion.div whileHover={reducedMotion ? undefined : { y: -3 }}>
              <ButtonLink href={primary.href} size="lg" className="min-w-44">
                {hasUser && configured ? "Go to dashboard" : configured ? "Create an account" : "Complete setup"}
              </ButtonLink>
            </motion.div>
            <motion.div whileHover={reducedMotion ? undefined : { y: -3 }}>
              <ButtonLink href="#preview" variant="secondary" size="lg" className="min-w-40">
                Review preview
              </ButtonLink>
            </motion.div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
