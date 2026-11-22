import type { Transition, Variants } from "motion/react";

/** Single source of truth for motion. Only transform/opacity are ever animated. */
export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

export const SPRING = {
  soft: { type: "spring", stiffness: 220, damping: 26, mass: 0.9 } satisfies Transition,
  snappy: { type: "spring", stiffness: 520, damping: 34, mass: 0.7 } satisfies Transition,
  indicator: { type: "spring", stiffness: 420, damping: 36 } satisfies Transition,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_PREMIUM } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: EASE_PREMIUM } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: EASE_PREMIUM } },
};

export const stagger = (step = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
});

export const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_PREMIUM } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: "easeIn" as const } },
};
