import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import type { DashboardData, SavedMedicalReport } from "../records/MedicalRecordsContext";
import { downloadPdfReport } from "./pdfReport";

export function DownloadPdfReportButton({ dashboardData, report }: { dashboardData: DashboardData; report: SavedMedicalReport | null }) {
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">("idle");

  const handleDownload = () => {
    if (!report) {
      setState("error");
      return;
    }

    try {
      setState("loading");
      downloadPdfReport({ dashboardData, report });
      setState("success");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button type="button" onClick={handleDownload} disabled={state === "loading"}>
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
        Download PDF report
      </Button>
      {state === "success" ? <p className="text-xs font-medium text-emerald-700">PDF report downloaded.</p> : null}
      {state === "error" ? <p className="text-xs font-medium text-red-700">PDF could not be generated because report data is missing.</p> : null}
    </div>
  );
}
