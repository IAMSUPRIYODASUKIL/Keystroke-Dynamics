import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SamplesPerUserChart({ samplesPerUser }: { samplesPerUser: Record<string, number> }) {
  const data = Object.entries(samplesPerUser).map(([name, count]) => ({ name, count }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barCategoryGap={20}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="0" vertical={false} />
        <XAxis dataKey="name" stroke="var(--color-text-muted)" tickLine={false} axisLine={{ stroke: "var(--color-border)" }} fontSize={12} />
        <YAxis stroke="var(--color-text-muted)" tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-text)",
          }}
        />
        <Bar dataKey="count" name="Samples" fill="var(--series-rf)" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
