import { useId, useMemo } from "react";
import clsx from "clsx";

interface CadenceTraceProps {
  /** Deterministic shape seed so SSR/re-renders never reshuffle the line. */
  seed?: number;
  points?: number;
  /** Draw the line in once and then let a highlight flow along it. */
  animated?: boolean;
  className?: string;
  /** Decorative by default. */
  title?: string;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 600;
const H = 120;

/** An ember rhythm line — the product's signature motif (keystroke cadence). */
export function CadenceTrace({ seed = 7, points = 28, animated = true, className, title }: CadenceTraceProps) {
  const gradientId = useId();
  const d = useMemo(() => {
    const rand = mulberry32(seed);
    const pts = Array.from({ length: points }, (_, i) => {
      const x = (i / (points - 1)) * W;
      const spike = rand() > 0.62 ? 0.35 + rand() * 0.65 : rand() * 0.22;
      const dir = rand() > 0.5 ? 1 : -1;
      return { x, y: H / 2 + dir * spike * (H / 2 - 10) };
    });
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      path += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    const last = pts[pts.length - 1];
    return `${path} L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  }, [seed, points]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={clsx("overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-accent-strong)" stopOpacity="0" />
          <stop offset="0.25" stopColor="var(--color-accent-strong)" />
          <stop offset="0.7" stopColor="var(--color-accent)" />
          <stop offset="1" stopColor="var(--color-spark)" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <line
        x1="0"
        x2={W}
        y1={H / 2}
        y2={H / 2}
        stroke="var(--color-border)"
        strokeWidth="1"
        strokeDasharray="2 6"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={d}
        pathLength={1}
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className={animated ? "trace-draw" : undefined}
        opacity={animated ? 0.55 : 0.9}
      />
      {animated && (
        <path
          d={d}
          pathLength={1}
          stroke="var(--color-spark)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="trace-flow"
          style={{ filter: "drop-shadow(0 0 6px var(--color-accent))" }}
        />
      )}
    </svg>
  );
}
