import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import type { AiSummaryResponse, AnalyzeReportResponse, UploadResponse } from "../../types/upload";

export type UploadState = "idle" | "validating" | "uploading" | "success" | "error";
export type AnalysisState = "idle" | "analyzing" | "success" | "error";
export type AiSummaryState = "idle" | "generating" | "success" | "error";

interface UploadSessionContextValue {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  uploadState: UploadState;
  setUploadState: (state: UploadState) => void;
  progress: number;
  setProgress: (progress: number) => void;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
  uploadResult: UploadResponse | null;
  setUploadResult: (result: UploadResponse | null) => void;
  analysisState: AnalysisState;
  setAnalysisState: (state: AnalysisState) => void;
  analysisError: string;
  setAnalysisError: (message: string) => void;
  analysisResult: AnalyzeReportResponse | null;
  setAnalysisResult: (result: AnalyzeReportResponse | null) => void;
  savedReportId: string;
  setSavedReportId: (id: string) => void;
  summaryState: AiSummaryState;
  setSummaryState: (state: AiSummaryState) => void;
  summaryError: string;
  setSummaryError: (message: string) => void;
  summary: AiSummaryResponse | null;
  setSummary: (summary: AiSummaryResponse | null) => void;
  resetSession: () => void;
}

const UploadSessionContext = createContext<UploadSessionContextValue | undefined>(undefined);

export function UploadSessionProvider({ children }: { children: ReactNode }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [analysisError, setAnalysisError] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalyzeReportResponse | null>(null);
  const [savedReportId, setSavedReportId] = useState("");
  const [summaryState, setSummaryState] = useState<AiSummaryState>("idle");
  const [summaryError, setSummaryError] = useState("");
  const [summary, setSummary] = useState<AiSummaryResponse | null>(null);

  const resetSession = () => {
    setSelectedFile(null);
    setUploadState("idle");
    setProgress(0);
    setErrorMessage("");
    setUploadResult(null);
    setAnalysisState("idle");
    setAnalysisError("");
    setAnalysisResult(null);
    setSavedReportId("");
    setSummaryState("idle");
    setSummaryError("");
    setSummary(null);
  };

  const value = useMemo(
    () => ({
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
      summaryState,
      setSummaryState,
      summaryError,
      setSummaryError,
      summary,
      setSummary,
      resetSession,
    }),
    [analysisError, analysisResult, analysisState, errorMessage, progress, savedReportId, selectedFile, summary, summaryError, summaryState, uploadResult, uploadState],
  );

  return <UploadSessionContext.Provider value={value}>{children}</UploadSessionContext.Provider>;
}

export function useUploadSession() {
  const context = useContext(UploadSessionContext);
  if (!context) {
    throw new Error("useUploadSession must be used inside UploadSessionProvider.");
  }
  return context;
}
