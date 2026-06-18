import { ChangeEvent, DragEvent, useRef } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, BarChart3, CheckCircle2, FileSearch, FileText, FileUp, Loader2, MessageSquareText, ShieldAlert, Sparkles, UploadCloud, X } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Progress } from "../../components/ui/Progress";
import { useMedicalRecords } from "../records/MedicalRecordsContext";
import { useUploadSession } from "./UploadSessionContext";
import { analyzeUploadedReport, generateAiSummary, uploadMedicalReport } from "../../services/uploadApi";
import type { AiSummaryParameter, AiSummaryResponse, AnalyzeReportResponse } from "../../types/upload";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const SUPPORTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];

export default function MedicalReportUploader() {
  const { saveAnalyzedReport, saveAiSummary } = useMedicalRecords();
  const {
    selectedFile,
    setSelectedFile,
    uploadState,
    setUploadState,
    progress,
    setProgress,
    errorMessage,
    setErrorMessage,
    uploadResult,
    setUploadResult,
    analysisState,
    setAnalysisState,
    analysisError,
    setAnalysisError,
    analysisResult,
    setAnalysisResult,
    savedReportId,
    setSavedReportId,
    resetSession,
  } = useUploadSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isBusy = uploadState === "validating" || uploadState === "uploading";
  const isAnalyzing = analysisState === "analyzing";

  const handleFile = (file: File | undefined) => {
    setErrorMessage("");
    setUploadResult(null);
    setAnalysisResult(null);
    setAnalysisError("");
    setAnalysisState("idle");
    setSavedReportId("");
    setProgress(0);

    if (!file) {
      return;
    }

    setUploadState("validating");
    const validationError = validateFile(file);
    if (validationError) {
      setSelectedFile(null);
      setUploadState("error");
      setErrorMessage(validationError);
      return;
    }

    setSelectedFile(file);
    setUploadState("idle");
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files[0]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadState("error");
      setErrorMessage("Select a supported medical report before uploading.");
      return;
    }

    try {
      setUploadState("uploading");
      setErrorMessage("");
      setProgress(0);
      const result = await uploadMedicalReport(selectedFile, setProgress);
      setUploadResult(result);
      setUploadState("success");
      setProgress(100);
    } catch (error) {
      setUploadState("error");
      setErrorMessage(resolveUploadError(error));
      setProgress(0);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadResult) {
      setAnalysisState("error");
      setAnalysisError("Upload a report before running analysis.");
      return;
    }

    try {
      setAnalysisState("analyzing");
      setAnalysisError("");
      const result = await analyzeUploadedReport(uploadResult.file_id, uploadResult.filename);
      const reportId = saveAnalyzedReport(result);
      setAnalysisResult(result);
      setSavedReportId(reportId);
      setAnalysisState("success");
    } catch (error) {
      setAnalysisState("error");
      setAnalysisError(resolveUploadError(error));
    }
  };

  const resetUpload = () => {
    resetSession();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="med-card rounded-lg p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-normal text-slate-950">Report file</h3>
          <p className="mt-1 text-sm text-muted-foreground">PDF, PNG, JPG, or JPEG. Maximum 20MB.</p>
        </div>
        {selectedFile ? (
          <Button type="button" variant="ghost" onClick={resetUpload} aria-label="Clear selected file">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-rose-200 bg-gradient-to-br from-rose-50 via-white to-red-50 px-6 py-8 text-center transition hover:border-primary hover:shadow-inner"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          onChange={handleInputChange}
          disabled={isBusy}
        />
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-rose-200">
          <UploadCloud className="h-7 w-7" aria-hidden="true" />
        </div>
        <span className="text-base font-semibold text-slate-950">Drop your report here or browse</span>
        <span className="mt-2 text-sm text-muted-foreground">Client checks run before upload. Server validation runs again.</span>
      </label>

      {selectedFile ? (
        <div className="mt-4 flex items-center gap-3 rounded-md border border-border bg-white p-3">
          <FileUp className="h-5 w-5 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-950">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
          </div>
        </div>
      ) : null}

      {uploadState === "uploading" ? (
        <div className="mt-5 space-y-2" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Uploading</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      ) : null}

      {uploadState === "success" && uploadResult ? (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 flex-none" aria-hidden="true" />
            <div>
              <p className="font-semibold">Upload complete</p>
              <p className="mt-1">File ID: {uploadResult.file_id}</p>
              <p className="mt-1">Uploaded: {new Date(uploadResult.upload_time).toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : null}

      {uploadState === "error" && errorMessage ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-none" aria-hidden="true" />
            <div>
              <p className="font-semibold">Upload failed</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          </div>
        </div>
      ) : null}

      <Button className="mt-5 w-full" type="button" disabled={!selectedFile || isBusy} onClick={handleUpload}>
        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
        Upload report
      </Button>

      {uploadResult ? (
        <Button className="mt-3 w-full bg-slate-900 hover:bg-slate-800" type="button" disabled={isAnalyzing} onClick={handleAnalyze}>
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileSearch className="h-4 w-4" aria-hidden="true" />}
          Extract and analyze report
        </Button>
      ) : null}

      {analysisState === "analyzing" ? (
        <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950" role="status" aria-live="polite">
          <div className="flex gap-3">
            <Loader2 className="h-5 w-5 flex-none animate-spin" aria-hidden="true" />
            <div>
              <p className="font-semibold">Extracting report data</p>
              <p className="mt-1">Running OCR, parameter extraction, and abnormality classification.</p>
            </div>
          </div>
        </div>
      ) : null}

      {analysisState === "error" && analysisError ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-none" aria-hidden="true" />
            <div>
              <p className="font-semibold">Analysis failed</p>
              <p className="mt-1">{analysisError}</p>
            </div>
          </div>
        </div>
      ) : null}

      {analysisState === "success" && analysisResult ? <AnalysisResults result={analysisResult} savedReportId={savedReportId} onSummarySaved={saveAiSummary} /> : null}
    </div>
  );
}

function AnalysisResults({
  result,
  savedReportId,
  onSummarySaved,
}: {
  result: AnalyzeReportResponse;
  savedReportId: string;
  onSummarySaved: (reportId: string, summary: AiSummaryResponse) => void;
}) {
  const { summaryState, setSummaryState, summaryError, setSummaryError, summary, setSummary } = useUploadSession();
  const foundCount = result.extracted_parameters.length;
  const missingCount = result.extraction_logs.filter((log) => log.status === "not_found").length;
  const isGeneratingSummary = summaryState === "generating";

  const handleGenerateSummary = async () => {
    try {
      setSummaryState("generating");
      setSummaryError("");
      const extractedParameters = toAiSummaryParameters(result);
      const abnormalValues = extractedParameters.filter((parameter) => parameter.severity !== "none");
      const generatedSummary = await generateAiSummary({
        extracted_parameters: extractedParameters,
        health_score: result.intelligence.health_score,
        abnormal_values: abnormalValues,
      });
      setSummary(generatedSummary);
      if (savedReportId) {
        onSummarySaved(savedReportId, generatedSummary);
      }
      setSummaryState("success");
    } catch (error) {
      setSummaryState("error");
      setSummaryError(resolveUploadError(error));
    }
  };

  return (
    <div className="mt-6 space-y-5 border-t border-border pt-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Health score" value={`${result.intelligence.health_score}/100`} />
        <Metric label="Extracted" value={`${foundCount}`} />
        <Metric label="Not found" value={`${missingCount}`} />
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-slate-950">Extracted parameters</h4>
        </div>
        {foundCount > 0 ? (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="max-h-80 overflow-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead className="bg-rose-50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Parameter</th>
                    <th className="px-3 py-2">Value</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.extracted_parameters.map((parameter) => {
                    const intelligence = result.intelligence.parameters.find((item) => item.parameter === parameter.parameter_name);
                    return (
                      <tr key={parameter.parameter_name}>
                        <td className="px-3 py-3 font-medium text-slate-950">{parameter.parameter_name}</td>
                        <td className="px-3 py-3 text-slate-700">
                          {parameter.value} {parameter.unit}
                        </td>
                        <td className="px-3 py-3">
                          <SeverityBadge severity={intelligence?.severity ?? "unknown"} status={intelligence?.status ?? "unclassified"} />
                        </td>
                        <td className="px-3 py-3 text-slate-700">{Math.round(parameter.confidence_score * 100)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">No supported parameters were detected in this report.</p>
        )}
      </section>

      {result.intelligence.risk_indicators.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <h4 className="text-sm font-semibold text-slate-950">Risk indicators</h4>
          </div>
          <div className="space-y-2">
            {result.intelligence.risk_indicators.map((risk) => (
              <div key={`${risk.parameter}-${risk.status}`} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <p className="font-semibold">
                  {risk.parameter}: {formatStatus(risk.status)}
                </p>
                <p className="mt-1">{risk.message}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h4 className="mb-2 text-sm font-semibold text-slate-950">Recommendations</h4>
        <div className="space-y-2">
          {result.intelligence.parameters.map((item) => (
            <p key={item.parameter} className="rounded-md bg-rose-50 p-3 text-sm text-slate-700">
              <span className="font-semibold text-slate-950">{item.parameter}:</span> {item.recommendation}
            </p>
          ))}
        </div>
      </section>

      <p className="rounded-md border border-border bg-white p-3 text-xs leading-5 text-muted-foreground">{result.intelligence.disclaimer}</p>

      <section className="rounded-lg border border-rose-200 bg-rose-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <h4 className="text-sm font-semibold text-slate-950">AI summary</h4>
            </div>
            <p className="mt-1 text-sm text-rose-950">Generate a simple explanation, lifestyle suggestions, and questions for your doctor.</p>
          </div>
          <Button className="bg-primary hover:bg-rose-800" type="button" disabled={isGeneratingSummary || foundCount === 0} onClick={handleGenerateSummary}>
            {isGeneratingSummary ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MessageSquareText className="h-4 w-4" aria-hidden="true" />}
            Generate AI summary
          </Button>
        </div>

        {summaryState === "generating" ? (
          <div className="mt-4 rounded-md border border-rose-300 bg-white p-3 text-sm text-rose-950" role="status" aria-live="polite">
            <div className="flex gap-3">
              <Loader2 className="h-5 w-5 flex-none animate-spin" aria-hidden="true" />
              <div>
                <p className="font-semibold">Writing summary</p>
                <p className="mt-1">Groq AI is preparing plain-language guidance without diagnosis.</p>
              </div>
            </div>
          </div>
        ) : null}

        {summaryState === "error" && summaryError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">
            <p className="font-semibold">AI summary failed</p>
            <p className="mt-1">{summaryError}</p>
          </div>
        ) : null}

        {summaryState === "success" && summary ? (
          <>
            <AiSummaryPanel summary={summary} />
            <Link
              to="/analytics"
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              View insights and graphs
            </Link>
          </>
        ) : null}
      </section>
    </div>
  );
}

function AiSummaryPanel({ summary }: { summary: AiSummaryResponse }) {
  return (
    <div className="mt-4 space-y-3">
      <SummaryBlock title="Simple summary" body={summary.simple_summary} />
      <SummaryBlock title="Detailed explanation" body={summary.detailed_explanation} />
      <SummaryList title="Lifestyle suggestions" items={summary.lifestyle_suggestions} />
      <SummaryList title="Questions to ask doctor" items={summary.questions_to_ask_doctor} />
      <p className="rounded-md border border-border bg-white p-3 text-xs leading-5 text-muted-foreground">{summary.disclaimer}</p>
    </div>
  );
}

function SummaryBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-3">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{body}</p>
    </div>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-border bg-white p-3">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function toAiSummaryParameters(result: AnalyzeReportResponse): AiSummaryParameter[] {
  return result.extracted_parameters.map((parameter) => {
    const intelligence = result.intelligence.parameters.find((item) => item.parameter === parameter.parameter_name);
    return {
      parameter_name: parameter.parameter_name,
      value: parameter.value,
      unit: parameter.unit,
      status: intelligence?.status ?? "unclassified",
      severity: intelligence?.severity ?? "unknown",
      reference_range: parameter.reference_range,
    };
  });
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-rose-50 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SeverityBadge({ severity, status }: { severity: string; status: string }) {
  const classNameBySeverity: Record<string, string> = {
    none: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    borderline: "bg-amber-50 text-amber-800 ring-amber-200",
    high: "bg-orange-50 text-orange-800 ring-orange-200",
    critical: "bg-red-50 text-red-700 ring-red-200",
    unknown: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return <span className={`inline-flex rounded-sm px-2 py-1 text-xs font-semibold ring-1 ${classNameBySeverity[severity] ?? classNameBySeverity.unknown}`}>{formatStatus(status)}</span>;
}

function formatStatus(status: string): string {
  return status.split("_").join(" ");
}

function validateFile(file: File): string {
  const extension = file.name.includes(".") ? `.${file.name.split(".").pop()?.toLowerCase()}` : "";

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return "Unsupported file type. Upload a PDF, PNG, JPG, or JPEG file.";
  }

  if (file.type && !SUPPORTED_MIME_TYPES.includes(file.type)) {
    return "Unsupported file type. Upload a PDF, PNG, JPG, or JPEG file.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File too large. Maximum upload size is 20MB.";
  }

  if (file.size === 0) {
    return "The selected file is empty or corrupted.";
  }

  return "";
}

function resolveUploadError(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) {
      return response.data.detail;
    }
  }

  if (typeof error === "object" && error !== null && "request" in error) {
    return "Network error. Check that the backend server is running and reachable.";
  }

  return "Upload failed unexpectedly. Please try again.";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

