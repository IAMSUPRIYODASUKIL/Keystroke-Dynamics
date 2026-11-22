import type { CSSProperties } from "react";

/** Shared recharts tooltip surface — uses theme tokens so it follows light/dark. */
export const TOOLTIP_STYLE: CSSProperties = {
  background: "var(--color-surface-solid)",
  border: "1px solid var(--color-border-glow)",
  borderRadius: 16,
  boxShadow: "var(--card-shadow)",
  color: "var(--color-text)",
  padding: "10px 14px",
  fontSize: 12,
};

export const TOOLTIP_CURSOR = { fill: "var(--color-surface-highlight)", opacity: 0.6 };
