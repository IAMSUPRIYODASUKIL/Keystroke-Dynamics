export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-[var(--color-text-muted)]">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]"
        aria-hidden="true"
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}
