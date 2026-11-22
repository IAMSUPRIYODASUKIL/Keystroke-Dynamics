import { CadenceTrace } from "@/components/CadenceTrace";

export function PageLoader({ label = "Processing biometric telemetry…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-6 py-28 text-(--color-text-muted) select-none"
    >
      <div className="relative h-16 w-64">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_26%,transparent),transparent)] blur-xl"
        />
        <CadenceTrace seed={11} points={22} className="h-full w-full" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <p className="font-display text-lg font-medium tracking-tight text-(--color-text)">{label}</p>
        <span className="font-mono text-[10px] tracking-[0.2em] text-(--color-text-dim) uppercase">
          Keystroke pipeline
        </span>
      </div>
    </div>
  );
}
