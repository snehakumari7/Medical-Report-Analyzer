import { BloodReportTable } from "../features/dashboard/BloodReportTable";
import { HealthRadarChart, TrendGraph } from "../features/dashboard/Charts";
import { EmptyState } from "../features/dashboard/DashboardStates";
import { useMedicalRecords } from "../features/records/MedicalRecordsContext";

export default function AnalyticsPage() {
  const { dashboardData } = useMedicalRecords();

  if (!dashboardData) {
    return <EmptyState title="No analytics yet" message="Analyze at least one report to unlock charts and trend analysis." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Analytics</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">Longitudinal insights</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Track score movement, selected biomarkers, and category-level report balance.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <TrendGraph data={dashboardData.trends} />
        <HealthRadarChart data={dashboardData.radar} />
      </div>
      <BloodReportTable parameters={dashboardData.parameters} />
    </div>
  );
}
