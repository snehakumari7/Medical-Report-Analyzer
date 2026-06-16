from pydantic import BaseModel, Field

from app.schemas.ai_summary import AISummaryParameter


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=2000)


class ChatbotContext(BaseModel):
    health_score: int | None = Field(default=None, ge=0, le=100)
    extracted_parameters: list[AISummaryParameter] = Field(default_factory=list, max_length=50)
    abnormal_values: list[AISummaryParameter] = Field(default_factory=list, max_length=50)
    report_filename: str | None = Field(default=None, max_length=255)


class ChatbotRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1200)
    context: ChatbotContext = Field(default_factory=ChatbotContext)
    conversation: list[ChatMessage] = Field(default_factory=list, max_length=12)


class ChatbotResponse(BaseModel):
    answer: str = Field(..., min_length=1)
    safety_note: str = Field(..., min_length=1)
