import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ActualVsTargetPoint } from "@/data/realDealers";

export function ActualVsTargetBars({
  title,
  data,
  unit = "$",
  subtitle,
}: {
  title: string;
  data: ActualVsTargetPoint[];
  unit?: "$" | "%" | "#";
  subtitle?: string;
}) {
  const fmt = (v: number) =>
    unit === "$" ? (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`) : unit === "%" ? `${v.toFixed(0)}%` : `${v}`;

  const chartData = data.map((d) => ({
    month: d.month.slice(2),
    Actual: d.actual,
    Target: d.target,
    met: d.actual >= d.target,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.012 256)" vertical={false} />
            <XAxis dataKey="month" stroke="oklch(0.5 0.03 258)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.5 0.03 258)" fontSize={10} tickLine={false} axisLine={false} width={48} tickFormatter={fmt} />
            <Tooltip
              contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.91 0.012 256)", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => fmt(v)}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
            <Bar dataKey="Actual" radius={[3, 3, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.met ? "oklch(0.62 0.18 145)" : "oklch(0.58 0.22 27)"} />
              ))}
            </Bar>
            <Bar dataKey="Target" fill="oklch(0.78 0.012 256)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
