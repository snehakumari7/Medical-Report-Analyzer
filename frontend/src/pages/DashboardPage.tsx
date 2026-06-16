import { Activity, AlertTriangle, FileText, TrendingUp } from "lucide-react";

import { BmiCalculator } from "../features/bmi/BmiCalculator";
import { AbnormalParameterCards } from "../features/dashboard/AbnormalParameterCards";
import { BloodReportTable } from "../features/dashboard/BloodReportTable";
import { HealthRadarChart, TrendGraph } from "../features/dashboard/Charts";
import { EmptyState } from "../features/dashboard/DashboardStates";
import { HealthScoreGauge } from "../features/dashboard/HealthScoreGauge";
import { getAbnormalParameters, useMedicalRecords } from "../features/records/MedicalRecordsContext";
import { DownloadPdfReportButton } from "../features/reports/DownloadPdfReportButton";

export default function DashboardPage() {
  const { dashboardData } = useMedicalRecords();

  if (!dashboardData) {
    return <EmptyState title="No reports analyzed yet" message="Upload and analyze your first medical report to unlock health score, charts, abnormalities, and trends." />;
  }
  const abnormalParameters = getAbnormalParameters(dashboardData.parameters);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">Healthcare dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">Clinical overview</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A focused view of report quality, abnormal values, and health trends across recent uploads.</p>
          <p className="mt-2 text-sm font-medium text-slate-700">Latest report: {dashboardData.latestReport?.filename}</p>
        </div>
        <DownloadPdfReportButton dashboardData={dashboardData} report={dashboardData.latestReport} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetric icon={Activity} label="Health score" value={`${dashboardData.healthScore}/100`} />
        <OverviewMetric icon={AlertTriangle} label="Abnormal markers" value={`${abnormalParameters.length}`} />
        <OverviewMetric icon={FileText} label="Reports" value={`${dashboardData.history.length}`} />
        <OverviewMetric icon={TrendingUp} label="Improving markers" value={`${dashboardData.improvingMarkers}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <HealthScoreGauge score={dashboardData.healthScore} />
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">Abnormal parameter cards</h3>
          <p className="mt-1 text-sm text-muted-foreground">Markers requiring monitoring or clinician discussion.</p>
          <div className="mt-5">
            <AbnormalParameterCards parameters={abnormalParameters} />
          </div>
        </div>
      </div>

      <BmiCalculator />

      <div className="grid gap-6 xl:grid-cols-2">
        <TrendGraph data={dashboardData.trends} />
        <HealthRadarChart data={dashboardData.radar} />
      </div>

      <BloodReportTable parameters={dashboardData.parameters} />
    </div>
  );
}

function OverviewMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
