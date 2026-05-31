import { CalendarDays, FileText } from "lucide-react";

import { EmptyState } from "../features/dashboard/DashboardStates";
import { useMedicalRecords } from "../features/records/MedicalRecordsContext";

export default function HistoryPage() {
  const { dashboardData } = useMedicalRecords();

  if (!dashboardData) {
    return <EmptyState title="No report history" message="Uploaded and analyzed reports will appear here." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">History</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">Report timeline</h2>
      </div>
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="divide-y divide-border">
          {dashboardData.history.map((report) => (
            <article key={report.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-md bg-rose-50 text-primary">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{report.filename}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      {report.date}
                    </span>
                    <span>{report.id}</span>
                    <span>{report.abnormalCount} abnormal markers</span>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-semibold text-slate-950">{report.healthScore}</p>
                <p className="text-xs font-medium uppercase text-muted-foreground">{report.status.replace("_", " ")}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
