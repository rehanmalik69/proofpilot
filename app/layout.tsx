import type { Metadata } from "next";
import { AppHeader } from "@/components/shared/app-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofPilot",
  description:
    "ProofPilot organizes evidence, timelines, and complaint drafts for consumer disputes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-950 antialiased">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(248,250,252,0.92))]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(180deg,white,transparent_88%)]" />
          <AppHeader />
          <main className="relative z-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
