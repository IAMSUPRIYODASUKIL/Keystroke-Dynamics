# 15 — Design System: "Ember & Smoke"

The web UI (`frontend/`) uses a single token-driven design system with a dark theme (warm graphite) and a light
theme (Pantone *Cloud Dancer* porcelain).
Both are verified against WCAG AA for text; re-check contrast whenever a token changes.

## Tokens
All colours are CSS variables defined in `frontend/src/index.css` on `:root` (dark) and `.light`. Components use
Tailwind's arbitrary-value syntax, e.g. `bg-(--color-surface)`, `text-(--color-text-muted)`, so switching the class
on `<html>` re-themes everything without re-rendering. `index.html` resolves the theme before first paint.

| Token group | Purpose |
|---|---|
| `--color-bg*`, `--color-surface*` | Page and card surfaces (layered "smoke" elevation) |
| `--color-text*` | Primary, secondary, muted, dim (dim is still ≥ 4.5:1 for placeholders) |
| `--color-accent`, `--color-accent-gradient`, `--color-ember-gradient`, `--color-spark` | The ember accent family |
| `--color-on-accent` | Text on ember fills (dark ink in dark mode; never white on `#e8622c`) |
| `--color-success/warning/danger` | Status colours; always paired with an icon and a label |
| `--series-rf/svm/lr` | Categorical chart colours |

## Type
Display: **Fraunces** (serif, with ember italic accents). UI: **Geist**. Keys and data: **Geist Mono**.

## Signature motifs
- **Cadence trace** (`CadenceTrace`) — an ember rhythm line used in the hero, loaders and 404.
- **Keycaps** (`Keycap`, `PhraseTypingBox`) — physical, claymorphic keys; typed keys stay pressed.
- Glass blur is limited to the navbar and tab bar; cards use opaque layered surfaces for performance.

## Motion
`motion` is used for reveals, count-ups, sliding indicators and route transitions. Rules:
only `transform`/`opacity` are animated; presets live in `src/lib/motion.ts`; everything honours
`prefers-reduced-motion` (`MotionConfig reducedMotion="user"` plus a global CSS fallback).

## Constraints worth knowing
- `PhraseTypingBox` is a restyle of the capture surface only. Keystroke timing lives in
  `hooks/useKeystrokeCapture.ts` and must not depend on rendering.
- The landing-page sandbox shows statistics computed from the visitor's real keystrokes
  (`utils/rhythm.ts`); it never displays a fabricated match score.
