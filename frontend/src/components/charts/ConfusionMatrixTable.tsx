interface ConfusionMatrixTableProps {
  matrix: number[][];
  labels: string[];
}

const SEQUENTIAL_STEPS = [
  "rgba(14, 165, 233, 0.15)",
  "rgba(14, 165, 233, 0.30)",
  "rgba(14, 165, 233, 0.45)",
  "rgba(14, 165, 233, 0.60)",
  "rgba(14, 165, 233, 0.75)",
  "rgba(14, 165, 233, 0.90)",
  "#0284c7",
  "#00f2fe",
];

export function ConfusionMatrixTable({ matrix, labels }: ConfusionMatrixTableProps) {
  const max = Math.max(1, ...matrix.flat());

  return (
    <div className="overflow-x-auto pt-2">
      <table className="w-full border-separate border-spacing-1.5 text-sm">
        <caption className="sr-only">Confusion matrix: rows are actual class, columns are predicted class.</caption>
        <thead>
          <tr>
            <th scope="col" className="p-2 text-left text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
              Actual \ Pred
            </th>
            {labels.map((label) => (
              <th key={label} scope="col" className="p-2 text-center text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
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
                const stepIndex = Math.min(
                  SEQUENTIAL_STEPS.length - 1,
                  Math.round(intensity * (SEQUENTIAL_STEPS.length - 1)),
                );
                return (
                  <td
                    key={j}
                    className="rounded-xl p-3 text-center font-mono-key text-sm font-bold transition-all duration-200 border border-(--color-border) shadow-xs"
                    style={{
                      backgroundColor: value === 0 ? "var(--color-surface-raised)" : SEQUENTIAL_STEPS[stepIndex],
                      color: value === 0 ? "var(--color-text-muted)" : (stepIndex > 4 ? "#04141a" : "#ffffff"),
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

