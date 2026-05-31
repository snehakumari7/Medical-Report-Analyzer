from pydantic import BaseModel, Field

from app.schemas.medical_intelligence import MedicalIntelligenceResponse


class AnalyzeUploadedReportRequest(BaseModel):
    file_id: str = Field(..., min_length=32, max_length=32, pattern=r"^[a-fA-F0-9]{32}$")
    filename: str = Field(..., min_length=1, max_length=255)


class ParsedParameterResponse(BaseModel):
    parameter_name: str
    value: float
    unit: str
    reference_range: str
    confidence_score: float
    matched_text: str


class ExtractionLogResponse(BaseModel):
    parameter_name: str
    status: str
    message: str | None = None
    matched_alias: str | None = None
    matched_text: str | None = None
    confidence_score: float | None = None


class AnalyzeUploadedReportResponse(BaseModel):
    file_id: str
    filename: str
    raw_text: str
    extracted_parameters: list[ParsedParameterResponse]
    extraction_logs: list[ExtractionLogResponse]
    intelligence: MedicalIntelligenceResponse
