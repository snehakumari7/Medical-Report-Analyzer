from __future__ import annotations

import json
import time
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.schemas.ai_summary import GenerateAISummaryResponse


class GroqSummaryError(RuntimeError):
    pass


class GroqConfigurationError(GroqSummaryError):
    pass


class GroqAPIError(GroqSummaryError):
    pass


class GroqTimeoutError(GroqSummaryError):
    pass


class GroqEmptyResponseError(GroqSummaryError):
    pass


class GroqInvalidJSONError(GroqSummaryError):
    pass


class GroqSummaryService:
    def __init__(self, settings: Settings, client: httpx.Client | None = None) -> None:
        self.settings = settings
        self.client = client or httpx.Client(timeout=settings.groq_timeout_seconds)

    def generate_summary(
        self,
        extracted_parameters: list[dict[str, Any]],
        health_score: int,
        abnormal_values: list[dict[str, Any]],
    ) -> GenerateAISummaryResponse:
        if not self.settings.groq_api_key:
            raise GroqConfigurationError("GROQ_API_KEY is not configured.")

        prompt = self._build_prompt(extracted_parameters, health_score, abnormal_values)
        response_json = self._call_groq_with_retry(prompt)
        text = self._extract_text(response_json)
        parsed = self._parse_model_json(text)
        return GenerateAISummaryResponse.model_validate(parsed)

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
                    "content": "You write simple, non-diagnostic medical report explanations and return strict JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
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

        required_keys = {
            "simple_summary",
            "detailed_explanation",
            "lifestyle_suggestions",
            "questions_to_ask_doctor",
            "disclaimer",
        }
        if not required_keys.issubset(parsed):
            raise GroqInvalidJSONError("Groq JSON response is missing required fields.")

        return parsed

    def _build_prompt(self, extracted_parameters: list[dict[str, Any]], health_score: int, abnormal_values: list[dict[str, Any]]) -> str:
        return (
            "Explain these medical report values in simple language.\n"
            "Safety rules:\n"
            "- Do not diagnose diseases.\n"
            "- Do not claim the user has a condition.\n"
            "- Only classify and explain parameter abnormalities.\n"
            "- Suggest clinician follow-up where appropriate.\n"
            "- Return only valid JSON with exactly these keys: simple_summary, detailed_explanation, lifestyle_suggestions, questions_to_ask_doctor, disclaimer.\n"
            "- lifestyle_suggestions and questions_to_ask_doctor must be arrays of short strings.\n\n"
            f"Health score: {health_score}/100\n"
            f"Extracted parameters JSON: {json.dumps(extracted_parameters, ensure_ascii=True)}\n"
            f"Abnormal values JSON: {json.dumps(abnormal_values, ensure_ascii=True)}\n"
        )


def get_groq_summary_service() -> GroqSummaryService:
    return GroqSummaryService(get_settings())
