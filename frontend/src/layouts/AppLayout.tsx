import { Suspense, useEffect } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Navbar } from "@/components/Navbar";
import { BrandMark } from "@/components/BrandMark";
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/hooks/useAuth";
import { pageTransition } from "@/lib/motion";

export function AppLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  const { isAuthenticated } = useAuth();

  // Start every route at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-(--color-accent) px-4 py-2 text-sm font-semibold text-(--color-on-accent) focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Atmosphere: ember aurora (gradients only — no blur filters) + hairline grid */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-aurora-a absolute -top-[28vh] -left-[12vw] h-[85vh] w-[70vw] rounded-full bg-[radial-gradient(closest-side,var(--aurora-a),transparent)]" />
        <div className="animate-aurora-b absolute top-[8vh] -right-[18vw] h-[90vh] w-[65vw] rounded-full bg-[radial-gradient(closest-side,var(--aurora-b),transparent)]" />
        <div className="animate-aurora-a absolute -bottom-[40vh] left-[18vw] h-[80vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,var(--aurora-c),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-subtle)_1px,transparent_1px)] bg-size-[72px_72px] opacity-60 mask-[radial-gradient(ellipse_70%_55%_at_50%_0%,#000_30%,transparent_100%)]" />
      </div>
      <div aria-hidden="true" className="grain" />

      <Navbar />

      <main
        id="main"
        className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-28 sm:px-6 md:pt-12 lg:pb-16"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
          >
            <Suspense fallback={<PageLoader />}>{outlet}</Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer
        className={
          "relative z-10 border-t border-(--color-border-subtle) px-4 py-8 text-xs text-(--color-text-muted) " +
          (isAuthenticated ? "pb-28 lg:pb-8" : "")
        }
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-6 w-6" />
            <span className="font-display text-sm tracking-tight text-(--color-text)">
              Keystroke <em className="ember-text font-normal">Dynamics</em>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-(--color-success)/30 bg-(--color-success)/10 px-2.5 py-0.5 text-[10px] font-semibold text-(--color-success)">
              <span className="h-1.5 w-1.5 rounded-full bg-(--color-success)" />
              Live ML pipeline
            </span>
          </div>
          <p className="text-center sm:text-right">
            Academic research prototype · 2026 · Every score is computed, never simulated
          </p>
        </div>
      </footer>
    </div>
  );
}
