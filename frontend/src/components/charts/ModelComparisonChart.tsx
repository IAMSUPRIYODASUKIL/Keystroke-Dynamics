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
  { key: "f1_score", label: "F1" },
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
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barGap={4} barCategoryGap={24}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="0" vertical={false} />
        <XAxis dataKey="metric" stroke="var(--color-text-muted)" tickLine={false} axisLine={{ stroke: "var(--color-border)" }} />
        <YAxis
          stroke="var(--color-text-muted)"
          tickLine={false}
          axisLine={false}
          unit="%"
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-text)",
          }}
          formatter={(value, name) => [`${value}%`, MODEL_LABELS[name as keyof typeof MODEL_LABELS] ?? name]}
        />
        <Legend
          formatter={(value: string) => MODEL_LABELS[value as keyof typeof MODEL_LABELS] ?? value}
          wrapperStyle={{ color: "var(--color-text-muted)", fontSize: 12 }}
        />
        {models.map((model) => (
          <Bar
            key={model.model_type}
            dataKey={model.model_type}
            fill={SERIES_COLOR[model.model_type] ?? "var(--series-rf)"}
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
