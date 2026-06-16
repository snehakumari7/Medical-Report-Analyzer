from fastapi import APIRouter, HTTPException, status

from app.schemas.chatbot import ChatbotRequest, ChatbotResponse
from app.services.groq_chat_service import get_groq_chat_service
from app.services.groq_summary_service import (
    GroqAPIError,
    GroqConfigurationError,
    GroqEmptyResponseError,
    GroqInvalidJSONError,
    GroqSummaryError,
    GroqTimeoutError,
)

router = APIRouter(tags=["AI Chatbot"])


@router.post(
    "/chatbot",
    response_model=ChatbotResponse,
    summary="Ask the Groq-powered medical report chatbot",
    description="Answers user questions using uploaded report context without diagnosing or replacing clinical advice.",
)
def ask_chatbot(payload: ChatbotRequest) -> ChatbotResponse:
    service = get_groq_chat_service()
    try:
        return service.answer_question(
            question=payload.question,
            context=payload.context,
            conversation=payload.conversation,
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
