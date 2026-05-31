import MedicalReportUploader from "../features/upload/MedicalReportUploader";

export default function UploadPage() {
  return (
    <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-normal text-primary">Upload and analyze</p>
        <h2 className="max-w-xl text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
          Upload a report for secure analysis.
        </h2>
        <p className="max-w-xl text-base leading-7 text-muted-foreground">
          Accepts PDF, PNG, JPG, and JPEG files up to 20MB. Files are validated, extracted, classified, and summarized in plain language.
        </p>
      </div>
      <MedicalReportUploader />
    </section>
  );
}
