import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FeatureImportance } from "@/types";

const FEATURE_LABELS: Record<string, string> = {
  mean_dwell: "Mean dwell time",
  median_dwell: "Median dwell time",
  std_dwell: "Dwell variability",
  min_dwell: "Min dwell time",
  max_dwell: "Max dwell time",
  cv_dwell: "Dwell consistency",
  p25_dwell: "Dwell 25th %ile",
  p75_dwell: "Dwell 75th %ile",
  mean_flight: "Mean flight time",
  median_flight: "Median flight time",
  std_flight: "Flight variability",
  min_flight: "Min flight time",
  max_flight: "Max flight time",
  cv_flight: "Flight consistency",
  p25_flight: "Flight 25th %ile",
  p75_flight: "Flight 75th %ile",
  mean_inter_key: "Mean inter-key",
  median_inter_key: "Median inter-key",
  std_inter_key: "Inter-key variability",
  min_inter_key: "Min inter-key",
  max_inter_key: "Max inter-key",
  cv_inter_key: "Inter-key consistency",
  typing_speed_cps: "Typing speed (cps)",
  total_duration_ms: "Total duration",
};

export function FeatureImportanceChart({ features }: { features: FeatureImportance[] }) {
  const top = [...features]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8)
    .map((f) => ({
      name: FEATURE_LABELS[f.feature] ?? f.feature,
      value: Number((f.importance * 100).toFixed(1)),
    }))
    .reverse();

  return (
    <div className="w-full pt-2">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={top} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
          <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            stroke="var(--color-text-muted)"
            unit="%"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            stroke="var(--color-text-muted)"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-text-secondary)", fontSize: 11, fontWeight: 500 }}
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
            formatter={(value) => [`${value}%`, "Feature Weight"]}
          />
          <Bar
            dataKey="value"
            fill="var(--series-rf)"
            radius={[0, 6, 6, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

