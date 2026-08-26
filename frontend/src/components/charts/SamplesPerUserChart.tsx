import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SamplesPerUserChart({ samplesPerUser }: { samplesPerUser: Record<string, number> }) {
  const data = Object.entries(samplesPerUser).map(([name, count]) => ({ name, count }));

  return (
    <div className="w-full pt-2">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barCategoryGap={24}>
          <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="var(--color-text-muted)"
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
            tick={{ fill: "var(--color-text-muted)", fontSize: 12, fontWeight: 500 }}
          />
          <YAxis
            stroke="var(--color-text-muted)"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
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
            formatter={(value) => [`${value} samples`, "Enrolled Data"]}
          />
          <Bar
            dataKey="count"
            name="Samples"
            fill="var(--series-rf)"
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

