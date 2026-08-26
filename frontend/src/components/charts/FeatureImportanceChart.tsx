import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FeatureImportance } from "@/types";

const FEATURE_LABELS: Record<string, string> = {
  mean_dwell: "Mean dwell time",
  median_dwell: "Median dwell time",
  std_dwell: "Dwell time variability",
  min_dwell: "Min dwell time",
  max_dwell: "Max dwell time",
  cv_dwell: "Dwell consistency (CV)",
  p25_dwell: "Dwell 25th percentile",
  p75_dwell: "Dwell 75th percentile",
  mean_flight: "Mean flight time",
  median_flight: "Median flight time",
  std_flight: "Flight time variability",
  min_flight: "Min flight time",
  max_flight: "Max flight time",
  cv_flight: "Flight consistency (CV)",
  p25_flight: "Flight 25th percentile",
  p75_flight: "Flight 75th percentile",
  mean_inter_key: "Mean inter-key interval",
  median_inter_key: "Median inter-key interval",
  std_inter_key: "Inter-key variability",
  min_inter_key: "Min inter-key interval",
  max_inter_key: "Max inter-key interval",
  cv_inter_key: "Inter-key consistency (CV)",
  typing_speed_cps: "Typing speed",
  total_duration_ms: "Total duration",
};

export function FeatureImportanceChart({ features }: { features: FeatureImportance[] }) {
  const top = [...features]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8)
    .map((f) => ({ name: FEATURE_LABELS[f.feature] ?? f.feature, value: Number((f.importance * 100).toFixed(1)) }))
    .reverse();

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={top} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" stroke="var(--color-text-muted)" unit="%" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          stroke="var(--color-text-muted)"
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-text)",
          }}
          formatter={(value) => [`${value}%`, "Relative importance"]}
        />
        <Bar dataKey="value" fill="var(--series-rf)" radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
