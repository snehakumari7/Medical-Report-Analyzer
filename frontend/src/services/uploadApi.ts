import axios from "axios";

import type { AiSummaryResponse, AnalyzeReportResponse, GenerateAiSummaryRequest, UploadResponse } from "../types/upload";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8011",
  timeout: 120000,
});

export async function uploadMedicalReport(file: File, onProgress: (progress: number) => void): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<UploadResponse>("/upload", formData, {
    onUploadProgress: (event) => {
      if (!event.total) {
        return;
      }
      onProgress(Math.round((event.loaded * 100) / event.total));
    },
  });

  return response.data;
}

export async function analyzeUploadedReport(fileId: string, filename: string): Promise<AnalyzeReportResponse> {
  const response = await apiClient.post<AnalyzeReportResponse>("/analyze-uploaded-report", {
    file_id: fileId,
    filename,
  });

  return response.data;
}

export async function generateAiSummary(payload: GenerateAiSummaryRequest): Promise<AiSummaryResponse> {
  const response = await apiClient.post<AiSummaryResponse>("/generate-ai-summary", payload);

  return response.data;
}
