interface ConfusionMatrixTableProps {
  matrix: number[][];
  labels: string[];
}

export function ConfusionMatrixTable({ matrix, labels }: ConfusionMatrixTableProps) {
  const max = Math.max(1, ...matrix.flat());

  return (
    <div className="overflow-x-auto pt-2">
      <table className="w-full border-separate border-spacing-1.5 text-sm">
        <caption className="sr-only">Confusion matrix: rows are actual class, columns are predicted class.</caption>
        <thead>
          <tr>
            <th scope="col" className="p-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-text-muted)">
              Actual \ Pred
            </th>
            {labels.map((label) => (
              <th key={label} scope="col" className="p-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-text-muted)">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th scope="row" className="p-2 text-left text-xs font-semibold text-(--color-text-secondary)">
                {labels[i]}
              </th>
              {row.map((value, j) => {
                const intensity = value / max;
                const strong = intensity > 0.55;
                return (
                  <td
                    key={j}
                    className="rounded-2xl border border-(--color-border) p-3.5 text-center font-mono-key text-sm font-bold transition-colors duration-300"
                    style={{
                      backgroundColor:
                        value === 0
                          ? "var(--color-bg-subtle)"
                          : `color-mix(in oklab, var(--color-accent) ${Math.round(12 + intensity * 88)}%, transparent)`,
                      color: value === 0 ? "var(--color-text-dim)" : strong ? "var(--color-on-accent)" : "var(--color-text)",
                    }}
                  >
                    <span>{value}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

