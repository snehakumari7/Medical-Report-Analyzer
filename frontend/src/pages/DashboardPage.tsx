import { useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, FileText, TrendingUp, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";

import { BmiCalculator } from "../features/bmi/BmiCalculator";
import { DashboardChatbot } from "../features/chat/DashboardChatbot";
import { AbnormalParameterCards } from "../features/dashboard/AbnormalParameterCards";
import { BloodReportTable } from "../features/dashboard/BloodReportTable";
import { HealthRadarChart, TrendGraph } from "../features/dashboard/Charts";
import { HealthScoreGauge } from "../features/dashboard/HealthScoreGauge";
import { DashboardParameter, getAbnormalParameters, RadarPoint, useMedicalRecords } from "../features/records/MedicalRecordsContext";
import { DownloadPdfReportButton } from "../features/reports/DownloadPdfReportButton";

type ChartScope = "recent" | "overall";

export default function DashboardPage() {
  const { dashboardData, reports } = useMedicalRecords();
  const [chartScope, setChartScope] = useState<ChartScope>("recent");
  const overallRadar = useMemo(() => buildOverallRadar(reports.flatMap((report) => report.parameters)), [reports]);

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <section className="med-card overflow-hidden rounded-lg">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-10">
              <p className="inline-flex rounded-full bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">AI powered medical report analyzer</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                Transform medical reports into actionable health insights.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                Your dashboard is empty because no report has been analyzed yet. Upload a blood report to unlock health score, abnormal markers, AI suggestions, charts, and history.
              </p>
              <Link
                to="/report-viewer"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-rose-800"
              >
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                Upload report
              </Link>
            </div>
            <div className="flex min-h-72 items-center justify-center bg-gradient-to-br from-rose-50 via-white to-red-50 p-8">
              <div className="w-full max-w-md rounded-lg border border-rose-100 bg-white p-6 shadow-xl shadow-rose-100/80">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
                    <Activity className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-950">Your Health Summary</p>
                    <p className="text-sm text-muted-foreground">Unlocks after first upload</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  {["Health score", "Abnormal markers", "AI summary", "Trend insights"].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-md border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm">
                      <span className="font-semibold text-slate-800">{item}</span>
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Pending</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 h-20 overflow-hidden rounded-md bg-rose-50">
                  <div className="h-full w-full bg-[linear-gradient(90deg,transparent_0_5%,rgba(220,38,38,.45)_5%_6%,transparent_6%_18%,rgba(220,38,38,.25)_18%_19%,transparent_19%_31%,rgba(220,38,38,.45)_31%_32%,transparent_32%_100%)]" />
                </div>
              </div>
            </div>
          </div>
        </section>
        <DashboardChatbot dashboardData={null} />
      </div>
    );
  }
  const abnormalParameters = getAbnormalParameters(dashboardData.parameters);
  const trendData = chartScope === "recent" ? dashboardData.trends.slice(-1) : dashboardData.trends;
  const radarData = chartScope === "recent" ? dashboardData.radar : overallRadar;

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

      <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="text-base font-semibold text-slate-950">Insights and graphs</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Switch between the most recent report and overall history.</p>
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-md border border-rose-200 bg-rose-50 p-1">
            {(["recent", "overall"] as const).map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => setChartScope(scope)}
                className={`h-9 rounded-sm px-3 text-sm font-semibold capitalize transition ${
                  chartScope === scope ? "bg-primary text-primary-foreground shadow-sm" : "text-rose-900 hover:bg-white"
                }`}
              >
                {scope === "recent" ? "Recent report" : "Overall data"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-6 xl:grid-cols-2">
          <TrendGraph data={trendData} description={chartScope === "recent" ? "Snapshot from the latest analyzed report." : "Health score and selected markers over time."} />
          <HealthRadarChart data={radarData} description={chartScope === "recent" ? "Category-level balance from latest report." : "Average category balance across all analyzed reports."} />
        </div>
      </section>

      <DashboardChatbot dashboardData={dashboardData} />

      <BloodReportTable parameters={dashboardData.parameters} />
    </div>
  );
}

function OverviewMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="med-card rounded-lg p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function buildOverallRadar(parameters: DashboardParameter[]): RadarPoint[] {
  const groups: Record<string, string[]> = {
    Blood: ["Hemoglobin", "RBC", "WBC", "Platelets"],
    Metabolic: ["Glucose", "HbA1c"],
    Lipids: ["Cholesterol", "HDL", "LDL", "Triglycerides"],
    Vitamins: ["Vitamin D", "Vitamin B12"],
  };

  return Object.entries(groups)
    .map(([category, names]) => {
      const groupParameters = parameters.filter((parameter) => names.includes(parameter.name));
      if (groupParameters.length === 0) {
        return null;
      }
      const score =
        groupParameters.reduce((total, parameter) => {
          const penalty = parameter.severity === "critical" ? 45 : parameter.severity === "high" ? 30 : parameter.severity === "borderline" ? 15 : 0;
          return total + Math.max(0, 100 - penalty);
        }, 0) / groupParameters.length;
      return { category, score: Math.round(score) };
    })
    .filter((point): point is RadarPoint => Boolean(point));
}
