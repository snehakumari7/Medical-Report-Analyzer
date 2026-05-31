export interface UploadResponse {
  file_id: string;
  filename: string;
  upload_time: string;
}

export interface ParsedParameter {
  parameter_name: string;
  value: number;
  unit: string;
  reference_range: string;
  confidence_score: number;
  matched_text: string;
}

export interface ExtractionLog {
  parameter_name: string;
  status: string;
  message?: string;
  matched_alias?: string;
  matched_text?: string;
  confidence_score?: number;
}

export interface ParameterIntelligence {
  parameter: string;
  value: number;
  unit: string;
  status: string;
  severity: string;
  recommendation: string;
  reference_unit: string;
  classification_band: string;
}

export interface RiskIndicator {
  parameter: string;
  status: string;
  severity: string;
  message: string;
}

export interface MedicalIntelligence {
  parameters: ParameterIntelligence[];
  risk_indicators: RiskIndicator[];
  health_score: number;
  disclaimer: string;
}

export interface AnalyzeReportResponse {
  file_id: string;
  filename: string;
  raw_text: string;
  extracted_parameters: ParsedParameter[];
  extraction_logs: ExtractionLog[];
  intelligence: MedicalIntelligence;
}

export interface AiSummaryParameter {
  parameter_name: string;
  value: number;
  unit: string;
  status: string;
  severity: string;
  reference_range?: string;
}

export interface GenerateAiSummaryRequest {
  extracted_parameters: AiSummaryParameter[];
  health_score: number;
  abnormal_values: AiSummaryParameter[];
}

export interface AiSummaryResponse {
  simple_summary: string;
  detailed_explanation: string;
  lifestyle_suggestions: string[];
  questions_to_ask_doctor: string[];
  disclaimer: string;
}
