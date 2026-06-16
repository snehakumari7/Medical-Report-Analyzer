import { useEffect, useMemo, useState } from "react";

import { BloodReportTable } from "../features/dashboard/BloodReportTable";
import { HealthRadarChart, TrendGraph, TrendLineConfig } from "../features/dashboard/Charts";
import { EmptyState } from "../features/dashboard/DashboardStates";
import { DashboardParameter, RadarPoint, SavedMedicalReport, toParameterTrendKey, useMedicalRecords } from "../features/records/MedicalRecordsContext";

type ChartScope = "recent" | "overall";

interface ParameterOption {
  name: string;
  unit: string;
  dataKey: string;
}

const chartColors = ["#d11f3f", "#f97316", "#0f766e", "#2563eb", "#7c3aed", "#be123c", "#16a34a", "#9333ea"];

export default function AnalyticsPage() {
  const { dashboardData, reports } = useMedicalRecords();
  const [chartScope, setChartScope] = useState<ChartScope>("overall");
  const [selectedParameterKeys, setSelectedParameterKeys] = useState<string[]>([]);
  const overallRadar = useMemo(() => buildOverallRadar(reports.flatMap((report) => report.parameters)), [reports]);
  const parameterOptions = useMemo(() => buildParameterOptions(chartScope === "recent" ? reports.slice(0, 1) : reports), [chartScope, reports]);

  useEffect(() => {
    setSelectedParameterKeys((currentKeys) => {
      const availableKeys = new Set(parameterOptions.map((option) => option.dataKey));
      const retainedKeys = currentKeys.filter((key) => availableKeys.has(key));
      if (retainedKeys.length > 0) {
        return retainedKeys;
      }
      return parameterOptions.slice(0, 4).map((option) => option.dataKey);
    });
  }, [parameterOptions]);

  if (!dashboardData) {
    return <EmptyState title="No analytics yet" message="Analyze at least one report to unlock charts and trend analysis." />;
  }
  const trendData = chartScope === "recent" ? dashboardData.trends.slice(-1) : dashboardData.trends;
  const radarData = chartScope === "recent" ? dashboardData.radar : overallRadar;
  const selectedLines = buildTrendLines(parameterOptions.filter((option) => selectedParameterKeys.includes(option.dataKey)));
  const visibleParameterNames = new Set(parameterOptions.filter((option) => selectedParameterKeys.includes(option.dataKey)).map((option) => option.name));
  const tableParameters = chartScope === "recent" ? dashboardData.parameters : buildLatestValuesForSelectedParameters(reports, visibleParameterNames);

  const toggleParameter = (dataKey: string) => {
    setSelectedParameterKeys((currentKeys) => {
      if (currentKeys.includes(dataKey)) {
        return currentKeys.filter((key) => key !== dataKey);
      }
      return [...currentKeys, dataKey].slice(-6);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">Analytics</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">Longitudinal insights</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Track score movement, selected biomarkers, and category-level report balance.</p>
        </div>
        <div className="grid w-full grid-cols-2 overflow-hidden rounded-md border border-rose-200 bg-rose-50 p-1 sm:w-auto">
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
      <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Parameter filter</h3>
            <p className="mt-1 text-sm text-muted-foreground">Choose extracted parameters to plot. The chart updates from your uploaded reports only.</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedParameterKeys(parameterOptions.slice(0, 6).map((option) => option.dataKey))}
            className="h-9 rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-900 transition hover:bg-rose-100"
          >
            Reset graph
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {parameterOptions.length > 0 ? (
            parameterOptions.map((option) => {
              const isSelected = selectedParameterKeys.includes(option.dataKey);
              return (
                <button
                  key={option.dataKey}
                  type="button"
                  onClick={() => toggleParameter(option.dataKey)}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    isSelected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100"
                  }`}
                >
                  {option.name}
                  {option.unit ? <span className="ml-1 text-xs opacity-80">({option.unit})</span> : null}
                </button>
              );
            })
          ) : (
            <p className="rounded-md border border-dashed border-rose-200 bg-rose-50 p-3 text-sm text-muted-foreground">No extracted parameters are available for this view.</p>
          )}
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <TrendGraph
          data={trendData}
          lines={selectedLines}
          description={chartScope === "recent" ? "Latest report values for your selected extracted parameters." : "Selected extracted parameter values across all analyzed reports."}
        />
        <HealthRadarChart data={radarData} description={chartScope === "recent" ? "Category-level balance from latest report." : "Average category balance across all analyzed reports."} />
      </div>
      <BloodReportTable parameters={tableParameters.length > 0 ? tableParameters : dashboardData.parameters} />
    </div>
  );
}

function buildParameterOptions(reports: SavedMedicalReport[]): ParameterOption[] {
  const optionsByKey = new Map<string, ParameterOption>();
  reports.forEach((report) => {
    report.parameters.forEach((parameter) => {
      const dataKey = toParameterTrendKey(parameter.name);
      if (!optionsByKey.has(dataKey)) {
        optionsByKey.set(dataKey, { name: parameter.name, unit: parameter.unit, dataKey });
      }
    });
  });
  return Array.from(optionsByKey.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildTrendLines(options: ParameterOption[]): TrendLineConfig[] {
  if (options.length === 0) {
    return [
      { dataKey: "healthScore", name: "Health score", stroke: "#d11f3f", strokeWidth: 3 },
      { dataKey: "abnormalMarkers", name: "Abnormal markers", stroke: "#9f1239", strokeWidth: 2 },
    ];
  }

  return options.map((option, index) => ({
    dataKey: option.dataKey,
    name: option.unit ? `${option.name} (${option.unit})` : option.name,
    stroke: chartColors[index % chartColors.length],
    strokeWidth: index === 0 ? 3 : 2,
  }));
}

function buildLatestValuesForSelectedParameters(reports: SavedMedicalReport[], selectedNames: Set<string>): DashboardParameter[] {
  const latestByName = new Map<string, DashboardParameter>();
  [...reports]
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
    .forEach((report) => {
      report.parameters.forEach((parameter) => {
        if (selectedNames.size === 0 || selectedNames.has(parameter.name)) {
          latestByName.set(parameter.name, parameter);
        }
      });
    });
  return Array.from(latestByName.values());
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
