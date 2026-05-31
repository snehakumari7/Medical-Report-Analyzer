from pydantic import BaseModel, Field


class ExtractedParameterRequest(BaseModel):
    parameter_name: str = Field(..., examples=["Glucose"])
    value: float = Field(..., examples=[104])
    unit: str = Field(..., examples=["mg/dL"])
    reference_range: str | None = Field(default=None, examples=["Fasting: 70-99 mg/dL"])
    confidence_score: float | None = Field(default=None, ge=0, le=1, examples=[0.95])


class AnalyzeParametersRequest(BaseModel):
    parameters: list[ExtractedParameterRequest] = Field(..., min_length=1)


class ParameterIntelligenceResponse(BaseModel):
    parameter: str
    value: float
    unit: str
    status: str
    severity: str
    recommendation: str
    reference_unit: str
    classification_band: str


class RiskIndicatorResponse(BaseModel):
    parameter: str
    status: str
    severity: str
    message: str


class MedicalIntelligenceResponse(BaseModel):
    parameters: list[ParameterIntelligenceResponse]
    risk_indicators: list[RiskIndicatorResponse]
    health_score: int = Field(..., ge=0, le=100)
    disclaimer: str
