import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { EASE_PREMIUM } from "@/lib/motion";

const NUMERIC = /^(\D*?)(-?\d[\d,]*(?:\.\d+)?)(.*)$/s;

interface Parsed {
  prefix: string;
  suffix: string;
  value: number;
  decimals: number;
  grouped: boolean;
}

function parse(input: string): Parsed | null {
  const match = NUMERIC.exec(input);
  if (!match) return null;
  const [, prefix, raw, suffix] = match;
  const grouped = raw.includes(",");
  const value = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;
  const decimals = raw.includes(".") ? raw.length - raw.indexOf(".") - 1 : 0;
  return { prefix, suffix, value, decimals, grouped };
}

function format(n: number, { decimals, grouped }: Pick<Parsed, "decimals" | "grouped">) {
  return grouped
    ? n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : n.toFixed(decimals);
}

/**
 * Counts up to a numeric string like "94.2%" or "1,284 ms" when scrolled into view.
 * Non-numeric text renders untouched. Honors prefers-reduced-motion.
 */
export function AnimatedNumber({ value, className }: { value: string | number; className?: string }) {
  const text = String(value);
  const parsed = parse(text);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const motionValue = useMotionValue(0);
  const shown = useTransform(motionValue, (v) =>
    parsed ? `${parsed.prefix}${format(v, parsed)}${parsed.suffix}` : text,
  );

  const target = parsed?.value ?? 0;
  useEffect(() => {
    if (!parsed) return;
    if (reduce) {
      motionValue.set(target);
      return;
    }
    if (!inView) return;
    const controls = animate(motionValue, target, { duration: 1.3, ease: EASE_PREMIUM });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, target, reduce]);

  if (!parsed) return <span className={className}>{text}</span>;

  return (
    <motion.span ref={ref} className={className} aria-label={text}>
      {shown}
    </motion.span>
  );
}
