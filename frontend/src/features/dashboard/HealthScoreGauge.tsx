import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export function HealthScoreGauge({ score }: { score: number }) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const data = [
    { name: "score", value: normalizedScore },
    { name: "remaining", value: 100 - normalizedScore },
  ];

  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">Health score</h3>
          <p className="mt-1 text-sm text-muted-foreground">Latest analyzed report</p>
        </div>
        <span className="rounded-sm bg-rose-50 px-2 py-1 text-xs font-semibold text-primary ring-1 ring-rose-200">Updated today</span>
      </div>
      <div className="relative mt-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} startAngle={210} endAngle={-30} innerRadius="72%" outerRadius="92%" dataKey="value" stroke="none">
              <Cell fill="#d11f3f" />
              <Cell fill="#fde2e7" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl font-semibold text-slate-950">{normalizedScore}</p>
            <p className="text-sm font-medium text-muted-foreground">out of 100</p>
          </div>
        </div>
      </div>
    </div>
  );
}
