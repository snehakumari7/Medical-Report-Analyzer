import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import type { AiSummaryResponse, AnalyzeReportResponse, ParameterIntelligence, ParsedParameter } from "../../types/upload";

export type Severity = "normal" | "borderline" | "high" | "critical" | "unknown";
export type LoadState = "loading" | "empty" | "error" | "success";

export interface SavedMedicalReport {
  id: string;
  userId: string;
  fileId: string;
  filename: string;
  uploadedAt: string;
  rawText: string;
  parameters: DashboardParameter[];
  healthScore: number;
  riskIndicators: AnalyzeReportResponse["intelligence"]["risk_indicators"];
  recommendations: ParameterIntelligence[];
  aiSummary?: AiSummaryResponse;
}

export interface DashboardParameter {
  name: string;
  value: number;
  unit: string;
  range: string;
  status: string;
  severity: Severity;
  confidence: number;
  trend: number;
}

export interface HistoryReport {
  id: string;
  date: string;
  filename: string;
  healthScore: number;
  abnormalCount: number;
  status: "reviewed" | "needs_review";
}

export interface TrendPoint {
  date: string;
  healthScore: number;
  abnormalMarkers: number;
  [parameterKey: string]: string | number | undefined;
}

export interface RadarPoint {
  category: string;
  score: number;
}

export interface DashboardData {
  healthScore: number;
  parameters: DashboardParameter[];
  history: HistoryReport[];
  trends: TrendPoint[];
  radar: RadarPoint[];
  latestReport: SavedMedicalReport | null;
  improvingMarkers: number;
}

interface MedicalRecordsContextValue {
  reports: SavedMedicalReport[];
  dashboardData: DashboardData | null;
  saveAnalyzedReport: (analysis: AnalyzeReportResponse) => string;
  saveAiSummary: (reportId: string, summary: AiSummaryResponse) => void;
}

const STORAGE_KEY = "medical-analyzer-reports";

const MedicalRecordsContext = createContext<MedicalRecordsContextValue | undefined>(undefined);

export function MedicalRecordsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allReports, setAllReports] = useState<SavedMedicalReport[]>(() => readReports());
  const reports = useMemo(() => allReports.filter((report) => report.userId === user?.id), [allReports, user?.id]);
  const dashboardData = useMemo(() => buildDashboardData(reports), [reports]);

  const value = useMemo<MedicalRecordsContextValue>(
    () => ({
      reports,
      dashboardData,
      saveAnalyzedReport: (analysis) => {
        if (!user) {
          throw new Error("Sign in before saving analyzed reports.");
        }
        const reportId = crypto.randomUUID();
        const savedReport: SavedMedicalReport = {
          id: reportId,
          userId: user.id,
          fileId: analysis.file_id,
          filename: analysis.filename,
          uploadedAt: new Date().toISOString(),
          rawText: analysis.raw_text,
          parameters: toDashboardParameters(analysis.extracted_parameters, analysis.intelligence.parameters, reports[0]?.parameters ?? []),
          healthScore: analysis.intelligence.health_score,
          riskIndicators: analysis.intelligence.risk_indicators,
          recommendations: analysis.intelligence.parameters,
        };
        const nextReports = [savedReport, ...allReports];
        writeReports(nextReports);
        setAllReports(nextReports);
        return reportId;
      },
      saveAiSummary: (reportId, summary) => {
        const nextReports = allReports.map((report) => (report.id === reportId ? { ...report, aiSummary: summary } : report));
        writeReports(nextReports);
        setAllReports(nextReports);
      },
    }),
    [allReports, dashboardData, reports, user],
  );

  return <MedicalRecordsContext.Provider value={value}>{children}</MedicalRecordsContext.Provider>;
}

export function useMedicalRecords() {
  const context = useContext(MedicalRecordsContext);
  if (!context) {
    throw new Error("useMedicalRecords must be used inside MedicalRecordsProvider.");
  }
  return context;
}

export function getAbnormalParameters(parameters: DashboardParameter[]) {
  return parameters.filter((parameter) => parameter.severity !== "normal");
}

function buildDashboardData(reports: SavedMedicalReport[]): DashboardData | null {
  if (reports.length === 0) {
    return null;
  }

  const sortedReports = [...reports].sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
  const latestReport = sortedReports[sortedReports.length - 1];
  const previousReport = sortedReports[sortedReports.length - 2];

  const trends = sortedReports.map((report) => {
    const point: TrendPoint = {
      date: formatShortDate(report.uploadedAt),
      healthScore: report.healthScore,
      abnormalMarkers: getAbnormalParameters(report.parameters).length,
    };
    report.parameters.forEach((parameter) => {
      point[toParameterTrendKey(parameter.name)] = parameter.value;
    });
    return point;
  });

  return {
    healthScore: latestReport.healthScore,
    parameters: latestReport.parameters,
    history: sortedReports
      .slice()
      .reverse()
      .map((report) => ({
        id: report.id,
        date: new Date(report.uploadedAt).toLocaleDateString(),
        filename: report.filename,
        healthScore: report.healthScore,
        abnormalCount: getAbnormalParameters(report.parameters).length,
        status: getAbnormalParameters(report.parameters).length > 0 ? "needs_review" : "reviewed",
      })),
    trends,
    radar: buildRadar(latestReport.parameters),
    latestReport,
    improvingMarkers: previousReport ? countImprovingMarkers(previousReport.parameters, latestReport.parameters) : 0,
  };
}

function toDashboardParameters(parsed: ParsedParameter[], intelligence: ParameterIntelligence[], previousParameters: DashboardParameter[]): DashboardParameter[] {
  return parsed.map((parameter) => {
    const matchingIntelligence = intelligence.find((item) => item.parameter === parameter.parameter_name);
    const previousValue = findParameterValue(previousParameters, parameter.parameter_name);
    return {
      name: parameter.parameter_name,
      value: parameter.value,
      unit: parameter.unit,
      range: parameter.reference_range,
      status: matchingIntelligence?.status ?? "unclassified",
      severity: normalizeSeverity(matchingIntelligence?.severity),
      confidence: parameter.confidence_score,
      trend: previousValue === undefined ? 0 : Number((parameter.value - previousValue).toFixed(2)),
    };
  });
}

function normalizeSeverity(severity: string | undefined): Severity {
  if (severity === "none") {
    return "normal";
  }
  if (severity === "borderline" || severity === "high" || severity === "critical") {
    return severity;
  }
  return "unknown";
}

function buildRadar(parameters: DashboardParameter[]): RadarPoint[] {
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

function countImprovingMarkers(previousParameters: DashboardParameter[], latestParameters: DashboardParameter[]): number {
  return latestParameters.filter((parameter) => {
    const previousParameter = previousParameters.find((item) => item.name === parameter.name);
    if (!previousParameter) {
      return false;
    }
    return severityRank(parameter.severity) < severityRank(previousParameter.severity);
  }).length;
}

function severityRank(severity: Severity): number {
  return { normal: 0, unknown: 1, borderline: 2, high: 3, critical: 4 }[severity];
}

function findParameterValue(parameters: DashboardParameter[], name: string): number | undefined {
  return parameters.find((parameter) => parameter.name.toLowerCase() === name.toLowerCase())?.value;
}

function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(date));
}

export function toParameterTrendKey(name: string): string {
  return `parameter_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

function readReports(): SavedMedicalReport[] {
  try {
    const rawReports = localStorage.getItem(STORAGE_KEY);
    return rawReports ? (JSON.parse(rawReports) as SavedMedicalReport[]) : [];
  } catch {
    return [];
  }
}

function writeReports(reports: SavedMedicalReport[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}
