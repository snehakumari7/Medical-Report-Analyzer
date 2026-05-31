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

export function TrendGraph({ data }: { data: TrendPoint[] }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">Trend graph</h3>
      <p className="mt-1 text-sm text-muted-foreground">Health score and selected markers over time.</p>
      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f6cdd5" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="healthScore" name="Health score" stroke="#d11f3f" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="abnormalMarkers" name="Abnormal markers" stroke="#9f1239" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="glucose" name="Glucose" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="ldl" name="LDL" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="hemoglobin" name="Hemoglobin" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function HealthRadarChart({ data }: { data: RadarPoint[] }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">Radar chart</h3>
      <p className="mt-1 text-sm text-muted-foreground">Category-level balance from latest report.</p>
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
