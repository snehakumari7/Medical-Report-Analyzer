from pydantic import BaseModel, Field


class AISummaryParameter(BaseModel):
    parameter_name: str = Field(..., min_length=1, max_length=120)
    value: float
    unit: str = Field(..., min_length=1, max_length=50)
    status: str = Field(..., min_length=1, max_length=60)
    severity: str = Field(..., min_length=1, max_length=60)
    reference_range: str | None = Field(default=None, max_length=255)


class GenerateAISummaryRequest(BaseModel):
    extracted_parameters: list[AISummaryParameter] = Field(..., min_length=1)
    health_score: int = Field(..., ge=0, le=100)
    abnormal_values: list[AISummaryParameter] = Field(default_factory=list)


class GenerateAISummaryResponse(BaseModel):
    simple_summary: str = Field(..., min_length=1)
    detailed_explanation: str = Field(..., min_length=1)
    lifestyle_suggestions: list[str] = Field(..., min_length=1)
    questions_to_ask_doctor: list[str] = Field(..., min_length=1)
    disclaimer: str = Field(..., min_length=1)
