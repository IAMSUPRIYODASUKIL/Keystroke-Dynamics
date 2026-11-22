import { useMemo } from "react";
import clsx from "clsx";
import { ShieldCheck, ShieldAlert, Fingerprint, Activity } from "lucide-react";
import type { RiskLevel } from "@/types";
import { AnimatedNumber } from "@/components/AnimatedNumber";

interface BiometricRadarProps {
  score?: number | null;
  riskLevel?: RiskLevel;
  isScanning?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const DIMENSIONS = {
  sm: { size: 120, stroke: 6, radius: 46, fontSize: "text-2xl", iconSize: 18 },
  md: { size: 180, stroke: 8, radius: 70, fontSize: "text-4xl", iconSize: 24 },
  lg: { size: 240, stroke: 10, radius: 95, fontSize: "text-5xl", iconSize: 32 },
} as const;

export function BiometricRadar({
  score = null,
  riskLevel = "unknown",
  isScanning = false,
  size = "md",
  label = "Biometric Similarity",
  className,
}: BiometricRadarProps) {
  const dimensions = DIMENSIONS[size];
  const center = dimensions.size / 2;

  const circumference = 2 * Math.PI * dimensions.radius;
  const validScore = score !== null && score !== undefined ? Math.max(0, Math.min(1, score)) : 0;
  const strokeDashoffset = circumference - validScore * circumference;

  const scheme = useMemo(() => {
    switch (riskLevel) {
      case "low":
        return { stroke: "var(--color-success)", glow: "var(--color-success-glow)", badge: "text-(--color-success) bg-(--color-success)/12 border-(--color-success)/30", label: "Verified Rhythm" };
      case "medium":
        return { stroke: "var(--color-warning)", glow: "var(--color-warning-glow)", badge: "text-(--color-warning) bg-(--color-warning)/12 border-(--color-warning)/30", label: "Moderate Anomaly" };
      case "high":
        return { stroke: "var(--color-danger)", glow: "var(--color-danger-glow)", badge: "text-(--color-danger) bg-(--color-danger)/12 border-(--color-danger)/30", label: "High Impostor Risk" };
      default:
        return { stroke: "var(--color-accent)", glow: "color-mix(in oklab, var(--color-accent) 28%, transparent)", badge: "text-(--color-accent) bg-(--color-accent)/10 border-(--color-accent)/30", label: "Awaiting Capture" };
    }
  }, [riskLevel]);

  // 60 fine tick marks around the dial
  const ticks = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const angle = (i / 60) * Math.PI * 2;
        const inner = dimensions.radius + dimensions.stroke / 2 + 5;
        const outer = inner + (i % 5 === 0 ? 6 : 3);
        return {
          x1: center + Math.cos(angle) * inner,
          y1: center + Math.sin(angle) * inner,
          x2: center + Math.cos(angle) * outer,
          y2: center + Math.sin(angle) * outer,
          major: i % 5 === 0,
        };
      }),
    [center, dimensions.radius, dimensions.stroke],
  );

  return (
    <div className={clsx("relative flex flex-col items-center justify-center select-none", className)}>
      <div className="relative flex items-center justify-center" style={{ width: dimensions.size, height: dimensions.size }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-4 rounded-full transition-all duration-700"
          style={{ boxShadow: score !== null || isScanning ? `0 0 56px -10px ${scheme.glow}` : undefined }}
        />

        <svg
          className="h-full w-full -rotate-90"
          viewBox={`0 0 ${dimensions.size} ${dimensions.size}`}
          role="img"
          aria-label={score !== null && !isScanning ? `${(validScore * 100).toFixed(0)}% biometric match` : "Biometric gauge"}
        >
          {ticks.map((tick, i) => (
            <line
              key={i}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="var(--color-border)"
              strokeWidth={tick.major ? 1.5 : 1}
              strokeLinecap="round"
            />
          ))}
          <circle cx={center} cy={center} r={dimensions.radius * 0.62} fill="none" stroke="var(--color-border)" strokeDasharray="2 5" strokeWidth="1" />
          <circle cx={center} cy={center} r={dimensions.radius} fill="none" stroke="var(--color-border)" strokeWidth={dimensions.stroke} />

          {score !== null && !isScanning && (
            <circle
              cx={center}
              cy={center}
              r={dimensions.radius}
              fill="none"
              stroke={scheme.stroke}
              strokeWidth={dimensions.stroke}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${scheme.glow})` }}
              className="transition-[stroke-dashoffset] duration-1000 ease-(--ease-premium)"
            />
          )}

          {isScanning && (
            <circle
              cx={center}
              cy={center}
              r={dimensions.radius}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={dimensions.stroke}
              strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
              strokeLinecap="round"
              style={{ transformOrigin: "center", filter: "drop-shadow(0 0 6px var(--color-accent))" }}
              className="animate-radar"
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
          {isScanning ? (
            <div className="flex flex-col items-center gap-1">
              <Activity className="animate-pulse text-(--color-accent)" size={dimensions.iconSize} />
              <span className="font-mono text-[10px] tracking-[0.2em] text-(--color-accent) uppercase">Analyzing</span>
            </div>
          ) : score !== null ? (
            <div className="flex flex-col items-center">
              <AnimatedNumber
                value={`${(validScore * 100).toFixed(0)}%`}
                className={clsx("font-display leading-none font-medium tracking-tight text-(--color-text) tabular-nums", dimensions.fontSize)}
              />
              <span className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-(--color-text-muted) uppercase">Match</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-(--color-text-muted)">
              <Fingerprint size={dimensions.iconSize} className="opacity-70" />
              <span className="mt-1 text-[9px] tracking-[0.18em] uppercase opacity-80">Ready</span>
            </div>
          )}
        </div>
      </div>

      {label && (
        <div className="mt-4 flex flex-col items-center gap-2 text-center">
          <span className="text-[11px] font-semibold tracking-[0.16em] text-(--color-text-muted) uppercase">{label}</span>
          {score !== null && (
            <span className={clsx("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", scheme.badge)}>
              {riskLevel === "low" ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
              {scheme.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
