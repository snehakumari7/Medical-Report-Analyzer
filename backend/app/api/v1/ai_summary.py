from fastapi import APIRouter, HTTPException, status

from app.schemas.ai_summary import GenerateAISummaryRequest, GenerateAISummaryResponse
from app.services.groq_summary_service import (
    GroqAPIError,
    GroqConfigurationError,
    GroqEmptyResponseError,
    GroqInvalidJSONError,
    GroqSummaryError,
    GroqTimeoutError,
    get_groq_summary_service,
)

router = APIRouter(tags=["AI Summaries"])


@router.post(
    "/generate-ai-summary",
    response_model=GenerateAISummaryResponse,
    summary="Generate a Groq-powered medical report summary",
    description="Creates a simple non-diagnostic summary, detailed explanation, lifestyle suggestions, and questions to ask a doctor using Groq.",
)
def generate_ai_summary(payload: GenerateAISummaryRequest) -> GenerateAISummaryResponse:
    service = get_groq_summary_service()
    try:
        return service.generate_summary(
            extracted_parameters=[parameter.model_dump() for parameter in payload.extracted_parameters],
            health_score=payload.health_score,
            abnormal_values=[parameter.model_dump() for parameter in payload.abnormal_values],
        )
    except GroqConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
    except GroqTimeoutError as exc:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc)) from exc
    except (GroqInvalidJSONError, GroqEmptyResponseError) as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except GroqAPIError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except GroqSummaryError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
