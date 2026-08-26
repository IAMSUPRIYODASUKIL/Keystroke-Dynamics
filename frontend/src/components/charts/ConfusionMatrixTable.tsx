interface ConfusionMatrixTableProps {
  matrix: number[][];
  labels: string[];
}

// Sequential blue ramp (dataviz skill palette.md) used to shade cells by
// magnitude — lightest step nearest the app's dark surface, darkest at max.
const SEQUENTIAL_STEPS = ["#104281", "#184f95", "#1c5cab", "#256abf", "#2a78d6", "#3987e5", "#5598e7", "#6da7ec"];

export function ConfusionMatrixTable({ matrix, labels }: ConfusionMatrixTableProps) {
  const max = Math.max(1, ...matrix.flat());

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-sm">
        <caption className="sr-only">Confusion matrix: rows are actual class, columns are predicted class.</caption>
        <thead>
          <tr>
            <th scope="col" className="p-2 text-left text-xs font-medium text-[var(--color-text-muted)]">
              Actual \ Predicted
            </th>
            {labels.map((label) => (
              <th key={label} scope="col" className="p-2 text-xs font-medium text-[var(--color-text-muted)]">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th scope="row" className="p-2 text-left text-xs font-medium text-[var(--color-text-muted)]">
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
                    className="rounded-md p-3 text-center font-semibold text-white"
                    style={{ backgroundColor: value === 0 ? "var(--color-surface-raised)" : SEQUENTIAL_STEPS[stepIndex] }}
                  >
                    <span className={value === 0 ? "text-[var(--color-text-muted)]" : ""}>{value}</span>
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
