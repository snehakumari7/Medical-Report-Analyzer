from __future__ import annotations

import json
import time
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.schemas.chatbot import ChatMessage, ChatbotContext, ChatbotResponse
from app.services.groq_summary_service import (
    GroqAPIError,
    GroqConfigurationError,
    GroqEmptyResponseError,
    GroqInvalidJSONError,
    GroqTimeoutError,
)


class GroqChatService:
    def __init__(self, settings: Settings, client: httpx.Client | None = None) -> None:
        self.settings = settings
        self.client = client or httpx.Client(timeout=settings.groq_timeout_seconds)

    def answer_question(self, question: str, context: ChatbotContext, conversation: list[ChatMessage]) -> ChatbotResponse:
        if not self.settings.groq_api_key:
            raise GroqConfigurationError("GROQ_API_KEY is not configured.")

        prompt = self._build_prompt(question, context, conversation)
        response_json = self._call_groq_with_retry(prompt)
        text = self._extract_text(response_json)
        parsed = self._parse_model_json(text)
        return ChatbotResponse.model_validate(parsed)

    def _call_groq_with_retry(self, prompt: str) -> dict[str, Any]:
        url = f"{self.settings.groq_api_base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.settings.groq_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.settings.groq_model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a careful medical report education assistant. "
                        "Use the provided report context when available. "
                        "Do not diagnose, prescribe, or replace a clinician. "
                        "Return strict JSON only."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.25,
            "response_format": {"type": "json_object"},
        }

        last_error: Exception | None = None
        for attempt in range(self.settings.groq_max_retries + 1):
            try:
                response = self.client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.TimeoutException as exc:
                last_error = exc
                if attempt >= self.settings.groq_max_retries:
                    raise GroqTimeoutError("Groq API request timed out.") from exc
            except httpx.HTTPStatusError as exc:
                last_error = exc
                if exc.response.status_code < 500 or attempt >= self.settings.groq_max_retries:
                    raise GroqAPIError("Groq API request failed.") from exc
            except httpx.HTTPError as exc:
                last_error = exc
                if attempt >= self.settings.groq_max_retries:
                    raise GroqAPIError("Groq API request failed.") from exc

            time.sleep(0.25 * (attempt + 1))

        raise GroqAPIError("Groq API request failed after retries.") from last_error

    def _extract_text(self, response_json: dict[str, Any]) -> str:
        try:
            text = str(response_json["choices"][0]["message"]["content"]).strip()
        except (KeyError, IndexError, TypeError) as exc:
            raise GroqEmptyResponseError("Groq returned an empty response.") from exc

        if not text:
            raise GroqEmptyResponseError("Groq returned an empty response.")
        return text

    def _parse_model_json(self, text: str) -> dict[str, Any]:
        cleaned_text = text.strip()
        if cleaned_text.startswith("```"):
            cleaned_text = cleaned_text.strip("`")
            cleaned_text = cleaned_text.removeprefix("json").strip()

        try:
            parsed = json.loads(cleaned_text)
        except json.JSONDecodeError as exc:
            raise GroqInvalidJSONError("Groq returned invalid JSON.") from exc

        if "answer" not in parsed or "safety_note" not in parsed:
            raise GroqInvalidJSONError("Groq JSON response is missing required fields.")

        return parsed

    def _build_prompt(self, question: str, context: ChatbotContext, conversation: list[ChatMessage]) -> str:
        context_json = {
            "health_score": context.health_score,
            "report_filename": context.report_filename,
            "extracted_parameters": [parameter.model_dump() for parameter in context.extracted_parameters],
            "abnormal_values": [parameter.model_dump() for parameter in context.abnormal_values],
        }
        conversation_json = [message.model_dump() for message in conversation[-8:]]

        return (
            "Answer the user's health-report question in simple language.\n"
            "Safety rules:\n"
            "- Do not diagnose diseases.\n"
            "- Do not prescribe medication or dosage.\n"
            "- Do not claim the user has a condition.\n"
            "- Explain what values can generally mean and suggest clinician follow-up when needed.\n"
            "- If the question is outside the provided report context, answer generally and say what information is missing.\n"
            "- Return only valid JSON with exactly these keys: answer, safety_note.\n\n"
            f"Report context JSON: {json.dumps(context_json, ensure_ascii=True)}\n"
            f"Recent conversation JSON: {json.dumps(conversation_json, ensure_ascii=True)}\n"
            f"User question: {question}\n"
        )


def get_groq_chat_service() -> GroqChatService:
    return GroqChatService(get_settings())
