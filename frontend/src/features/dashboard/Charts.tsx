import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RadarPoint, TrendPoint } from "../records/MedicalRecordsContext";

export interface TrendLineConfig {
  dataKey: string;
  name: string;
  stroke: string;
  strokeWidth?: number;
}

const defaultTrendLines: TrendLineConfig[] = [
  { dataKey: "healthScore", name: "Health score", stroke: "#d11f3f", strokeWidth: 3 },
  { dataKey: "abnormalMarkers", name: "Abnormal markers", stroke: "#9f1239", strokeWidth: 2 },
];

export function TrendGraph({
  data,
  description = "Health score and selected markers over time.",
  lines = defaultTrendLines,
}: {
  data: TrendPoint[];
  description?: string;
  lines?: TrendLineConfig[];
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">Trend graph</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f6cdd5" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth ?? 2}
                dot={{ r: line.strokeWidth === 3 ? 4 : 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function HealthRadarChart({ data, description = "Category-level balance from latest report." }: { data: RadarPoint[]; description?: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">Radar chart</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 h-72">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="#f6cdd5" />
              <PolarAngleAxis dataKey="category" tick={{ fill: "#7f1d1d", fontSize: 12 }} />
              <Radar name="Score" dataKey="score" stroke="#d11f3f" fill="#fb7185" fillOpacity={0.24} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-rose-200 bg-rose-50 text-sm text-muted-foreground">
            Analyze a report with supported categories to build this chart.
          </div>
        )}
      </div>
    </div>
  );
}
