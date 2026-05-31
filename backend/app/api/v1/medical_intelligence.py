from fastapi import APIRouter, HTTPException, status

from app.schemas.medical_intelligence import AnalyzeParametersRequest, MedicalIntelligenceResponse
from app.services.medical_intelligence_service import MedicalIntelligenceError, get_medical_intelligence_engine

router = APIRouter(tags=["Medical Intelligence"])


@router.post(
    "/analyze-parameters",
    response_model=MedicalIntelligenceResponse,
    summary="Classify extracted medical parameters",
    description="Classifies extracted parameter values into normal, borderline, high, or critical bands. This endpoint does not diagnose disease.",
)
def analyze_parameters(payload: AnalyzeParametersRequest) -> MedicalIntelligenceResponse:
    engine = get_medical_intelligence_engine()
    try:
        result = engine.analyze([parameter.model_dump() for parameter in payload.parameters])
    except MedicalIntelligenceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return MedicalIntelligenceResponse.model_validate(result)
