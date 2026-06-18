import { BmiCalculator } from "../features/bmi/BmiCalculator";
import MedicalReportUploader from "../features/upload/MedicalReportUploader";

export default function ReportViewerPage() {
  return (
    <section className="grid gap-8 xl:grid-cols-[0.75fr_1.25fr] xl:items-start">
      <div className="space-y-5">
        <div className="med-card rounded-lg p-6">
          <p className="inline-flex rounded-full bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Report viewer</p>
          <h2 className="mt-3 max-w-xl text-3xl font-black tracking-normal text-slate-950">Upload, extract, analyze, and summarize.</h2>
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
