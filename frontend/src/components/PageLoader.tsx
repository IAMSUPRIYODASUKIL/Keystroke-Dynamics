import { Fingerprint } from "lucide-react";

export function PageLoader({ label = "Processing biometric telemetry…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-(--color-text-muted) select-none">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Pulsing ambient glow */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(0,242,254,0.3)_0%,transparent_70%)] animate-ping opacity-30" />
        
        {/* Orbital rings */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-(--color-accent) border-r-(--color-accent-secondary) animate-spin" />
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent border-b-emerald-400 border-l-(--color-accent) animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />

        {/* Center Fingerprint icon */}
        <Fingerprint size={22} className="text-(--color-accent) animate-pulse" />
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium tracking-wide text-(--color-text)">
          {label}
        </p>
        <span className="text-[11px] font-mono uppercase tracking-widest text-(--color-text-muted)">
          Keystroke Pipeline v2.6
        </span>
      </div>
    </div>
  );
}

