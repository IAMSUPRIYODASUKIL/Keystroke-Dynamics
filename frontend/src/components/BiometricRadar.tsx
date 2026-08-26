import { useMemo } from "react";
import clsx from "clsx";
import { ShieldCheck, ShieldAlert, Fingerprint, Activity } from "lucide-react";
import type { RiskLevel } from "@/types";

interface BiometricRadarProps {
  score?: number | null;
  riskLevel?: RiskLevel;
  isScanning?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function BiometricRadar({
  score = null,
  riskLevel = "unknown",
  isScanning = false,
  size = "md",
  label = "Biometric Similarity",
  className,
}: BiometricRadarProps) {
  const dimensions = {
    sm: { size: 120, stroke: 6, radius: 46, fontSize: "text-lg", iconSize: 18 },
    md: { size: 180, stroke: 8, radius: 70, fontSize: "text-2xl", iconSize: 24 },
    lg: { size: 240, stroke: 10, radius: 95, fontSize: "text-3xl", iconSize: 32 },
  }[size];

  const circumference = 2 * Math.PI * dimensions.radius;
  const validScore = score !== null && score !== undefined ? Math.max(0, Math.min(1, score)) : 0;
  const strokeDashoffset = circumference - validScore * circumference;

  const colorScheme = useMemo(() => {
    if (riskLevel === "low") {
      return {
        stroke: "var(--color-success)",
        glow: "rgba(16, 185, 129, 0.4)",
        gradient: "emerald",
        badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        label: "Verified Rhythm",
      };
    }
    if (riskLevel === "medium") {
      return {
        stroke: "var(--color-warning)",
        glow: "rgba(245, 158, 11, 0.4)",
        gradient: "amber",
        badge: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        label: "Moderate Anomaly",
      };
    }
    if (riskLevel === "high") {
      return {
        stroke: "var(--color-danger)",
        glow: "rgba(244, 63, 94, 0.4)",
        gradient: "rose",
        badge: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        label: "High Impostor Risk",
      };
    }
    return {
      stroke: "var(--color-accent)",
      glow: "rgba(0, 242, 254, 0.3)",
      gradient: "cyan",
      badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      label: "Awaiting Capture",
    };
  }, [riskLevel]);

  return (
    <div className={clsx("relative flex flex-col items-center justify-center select-none", className)}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: dimensions.size, height: dimensions.size }}
      >
        {/* Outer subtle glow ring */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-700 pointer-events-none"
          style={{
            boxShadow: score !== null ? `0 0 35px -8px ${colorScheme.glow}` : undefined,
          }}
        />

        {/* SVG Gauge and Radar Grid */}
        <svg
          className="w-full h-full -rotate-90"
          viewBox={`0 0 ${dimensions.size} ${dimensions.size}`}
        >
          {/* Subtle concentric radar guide circles */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={dimensions.radius * 0.4}
            fill="none"
            stroke="currentColor"
            className="text-[var(--color-border)]"
            strokeDasharray="2 4"
            strokeWidth="1"
          />
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={dimensions.radius * 0.7}
            fill="none"
            stroke="currentColor"
            className="text-[var(--color-border)]"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Background track circle */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={dimensions.radius}
            fill="none"
            stroke="currentColor"
            className="text-[var(--color-border)]"
            strokeWidth={dimensions.stroke}
          />

          {/* Value arc */}
          {score !== null && !isScanning && (
            <circle
              cx={dimensions.size / 2}
              cy={dimensions.size / 2}
              r={dimensions.radius}
              fill="none"
              stroke={colorScheme.stroke}
              strokeWidth={dimensions.stroke}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          )}

          {/* Scanning radar sweep animation */}
          {isScanning && (
            <circle
              cx={dimensions.size / 2}
              cy={dimensions.size / 2}
              r={dimensions.radius}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={dimensions.stroke}
              strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
              strokeLinecap="round"
              className="animate-radar origin-center"
            />
          )}
        </svg>

        {/* Center Readout / Icon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          {isScanning ? (
            <div className="flex flex-col items-center gap-1">
              <Activity className="animate-pulse text-[var(--color-accent)]" size={dimensions.iconSize} />
              <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--color-accent)]">
                Analyzing
              </span>
            </div>
          ) : score !== null ? (
            <div className="flex flex-col items-center">
              <span className={clsx("font-bold tracking-tight font-mono-key text-[var(--color-text)]", dimensions.fontSize)}>
                {(validScore * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                Match
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-[var(--color-text-muted)]">
              <Fingerprint size={dimensions.iconSize} className="opacity-60" />
              <span className="text-[9px] uppercase tracking-wider mt-1 opacity-75">Ready</span>
            </div>
          )}
        </div>
      </div>

      {label && (
        <div className="mt-3 flex flex-col items-center gap-1 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {label}
          </span>
          {score !== null && (
            <span className={clsx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", colorScheme.badge)}>
              {riskLevel === "low" ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
              {colorScheme.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
