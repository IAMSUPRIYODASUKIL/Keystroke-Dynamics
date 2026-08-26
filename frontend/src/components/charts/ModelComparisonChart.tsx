import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ModelMetrics } from "@/types";
import { MODEL_LABELS } from "@/utils/format";

const SERIES_COLOR: Record<string, string> = {
  random_forest: "var(--series-rf)",
  svm: "var(--series-svm)",
  logistic_regression: "var(--series-lr)",
};

interface ModelComparisonChartProps {
  models: ModelMetrics[];
}

const METRIC_KEYS = [
  { key: "accuracy", label: "Accuracy" },
  { key: "precision", label: "Precision" },
  { key: "recall", label: "Recall" },
  { key: "f1_score", label: "F1 Score" },
] as const;

export function ModelComparisonChart({ models }: ModelComparisonChartProps) {
  const data = METRIC_KEYS.map(({ key, label }) => {
    const row: Record<string, string | number> = { metric: label };
    for (const model of models) {
      row[model.model_type] = Number((model[key] * 100).toFixed(1));
    }
    return row;
  });

  return (
    <div className="w-full pt-2">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} barGap={6} barCategoryGap={28}>
          <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="metric"
            stroke="var(--color-text-muted)"
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
            tick={{ fill: "var(--color-text-muted)", fontSize: 12, fontWeight: 500 }}
          />
          <YAxis
            stroke="var(--color-text-muted)"
            tickLine={false}
            axisLine={false}
            unit="%"
            domain={[0, 100]}
            tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "var(--color-surface-highlight)", opacity: 0.3 }}
            contentStyle={{
              background: "var(--color-surface-solid)",
              border: "1px solid var(--color-border-glow)",
              borderRadius: 12,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
              color: "var(--color-text)",
              padding: "10px 14px",
            }}
            formatter={(value, name) => [
              `${value}%`,
              MODEL_LABELS[name as keyof typeof MODEL_LABELS] ?? name,
            ]}
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs font-medium text-(--color-text-secondary)">
                {MODEL_LABELS[value as keyof typeof MODEL_LABELS] ?? value}
              </span>
            )}
            wrapperStyle={{ paddingTop: 16 }}
          />
          {models.map((model) => (
            <Bar
              key={model.model_type}
              dataKey={model.model_type}
              fill={SERIES_COLOR[model.model_type] ?? "var(--series-rf)"}
              radius={[6, 6, 0, 0]}
              maxBarSize={38}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

