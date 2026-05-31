import { BmiCalculator } from "../features/bmi/BmiCalculator";
import MedicalReportUploader from "../features/upload/MedicalReportUploader";

export default function ReportViewerPage() {
  return (
    <section className="grid gap-8 xl:grid-cols-[0.75fr_1.25fr] xl:items-start">
      <div className="space-y-5">
        <div className="rounded-lg border border-rose-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">Report viewer</p>
          <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-normal text-slate-950">Upload, extract, analyze, and summarize.</h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
            Upload a report, run OCR extraction, review detected parameters, classify abnormalities, and generate a plain-language AI summary.
          </p>
        </div>
        <BmiCalculator />
      </div>
      <MedicalReportUploader />
    </section>
  );
}
