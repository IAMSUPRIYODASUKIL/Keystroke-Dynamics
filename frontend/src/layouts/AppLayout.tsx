import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Shield, Sparkles } from "lucide-react";

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col selection:bg-(--color-accent)/20 selection:text-(--color-accent)">
      {/* Dynamic Ambient Background Glow Mesh */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="animate-ambient-1 absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,242,254,0.12)_0%,rgba(0,242,254,0)_70%)] blur-3xl dark:opacity-100 opacity-60" />
        <div className="animate-ambient-2 absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,rgba(139,92,246,0)_70%)] blur-3xl dark:opacity-100 opacity-50" />
        <div className="animate-ambient-1 absolute -bottom-40 left-1/4 h-[550px] w-[550px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,rgba(16,185,129,0)_70%)] blur-3xl dark:opacity-100 opacity-40" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-subtle)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      {/* Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 md:py-12">
        <Outlet />
      </main>

      {/* Luxury Specular Footer */}
      <footer className="relative z-10 border-t border-(--color-border) bg-(--color-surface)/60 backdrop-blur-md px-4 py-8 text-center text-xs text-(--color-text-muted)">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 font-medium text-(--color-text)">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-(--color-accent)/15 text-(--color-accent)">
              <Shield size={12} />
            </span>
            <span className="tracking-wide">Keystroke Biometric Authentication</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live ML Pipeline
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-(--color-text-muted)">
            <span className="inline-flex items-center gap-1">
              <Sparkles size={12} className="text-(--color-accent)" />
              Academic Research Prototype (2026)
            </span>
            <span>·</span>
            <span>Zero Synthetic Scores</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

