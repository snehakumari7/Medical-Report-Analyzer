import type { DashboardParameter } from "../records/MedicalRecordsContext";
import { SeverityBadge } from "./SeverityBadge";

export function BloodReportTable({ parameters }: { parameters: DashboardParameter[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="border-b border-border p-5">
        <h3 className="text-base font-semibold text-slate-950">Blood report table</h3>
        <p className="mt-1 text-sm text-muted-foreground">Latest extracted values and severity indicators.</p>
      </div>
      <div className="overflow-auto">
        {parameters.length > 0 ? (
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-rose-50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Parameter</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Reference range</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {parameters.map((parameter) => (
                <tr key={parameter.name} className="hover:bg-rose-50">
                  <td className="px-4 py-3 font-medium text-slate-950">{parameter.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {parameter.value} {parameter.unit}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{parameter.range}</td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={parameter.severity} label={parameter.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{Math.round(parameter.confidence * 100)}%</td>
                  <td className="px-4 py-3 text-slate-700">{parameter.trend === 0 ? "new/stable" : `${parameter.trend > 0 ? "+" : ""}${parameter.trend}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-5 text-sm text-muted-foreground">No supported parameters were extracted from the latest report.</div>
        )}
      </div>
    </div>
  );
}
