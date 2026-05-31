import type { Severity } from "../records/MedicalRecordsContext";

const badgeClass: Record<Severity, string> = {
  normal: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  borderline: "bg-amber-50 text-amber-800 ring-amber-200",
  high: "bg-orange-50 text-orange-800 ring-orange-200",
  critical: "bg-red-50 text-red-700 ring-red-200",
  unknown: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function SeverityBadge({ severity, label }: { severity: Severity; label?: string }) {
  return <span className={`inline-flex rounded-sm px-2 py-1 text-xs font-semibold ring-1 ${badgeClass[severity]}`}>{label ?? severity}</span>;
}
