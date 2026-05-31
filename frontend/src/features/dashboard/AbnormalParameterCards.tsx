import { TrendingDown, TrendingUp } from "lucide-react";

import type { DashboardParameter } from "../records/MedicalRecordsContext";
import { SeverityBadge } from "./SeverityBadge";

export function AbnormalParameterCards({ parameters }: { parameters: DashboardParameter[] }) {
  if (parameters.length === 0) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        No abnormal supported parameters were found in the latest analyzed report.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {parameters.map((parameter) => {
        const TrendIcon = parameter.trend >= 0 ? TrendingUp : TrendingDown;
        return (
          <article key={parameter.name} className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{parameter.name}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {parameter.value}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">{parameter.unit}</span>
                </p>
              </div>
              <SeverityBadge severity={parameter.severity} label={parameter.status} />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ref: {parameter.range}</span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                <TrendIcon className="h-4 w-4" aria-hidden="true" />
                {parameter.trend === 0 ? "new" : Math.abs(parameter.trend)}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
