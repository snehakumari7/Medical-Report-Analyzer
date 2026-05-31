import json

import httpx
import pytest

from app.core.config import Settings
from app.services.groq_summary_service import (
    GroqAPIError,
    GroqEmptyResponseError,
    GroqInvalidJSONError,
    GroqSummaryService,
    GroqTimeoutError,
)


def make_settings() -> Settings:
    settings = Settings()
    settings.groq_api_key = "test-key"
    settings.groq_model = "deepseek-v3"
    settings.groq_api_base_url = "https://example.test/openai/v1"
    settings.groq_timeout_seconds = 1
    settings.groq_max_retries = 1
    return settings


def make_request_payload() -> tuple[list[dict], int, list[dict]]:
    extracted_parameters = [
        {"parameter_name": "Glucose", "value": 104, "unit": "mg/dL", "status": "borderline_high", "severity": "borderline"}
    ]
    abnormal_values = extracted_parameters
    return extracted_parameters, 95, abnormal_values


def groq_response(payload: dict) -> httpx.Response:
    return httpx.Response(
        200,
        json={"choices": [{"message": {"content": json.dumps(payload)}}]},
    )


def test_generate_summary_success() -> None:
    payload = {
        "simple_summary": "Your report has one borderline value.",
        "detailed_explanation": "Glucose is slightly above the fasting reference range.",
        "lifestyle_suggestions": ["Keep regular meal timing.", "Discuss activity goals with a clinician."],
        "questions_to_ask_doctor": ["Should I repeat this test fasting?"],
        "disclaimer": "This is not a diagnosis.",
    }
    transport = httpx.MockTransport(lambda _request: groq_response(payload))
    service = GroqSummaryService(make_settings(), client=httpx.Client(transport=transport))

    result = service.generate_summary(*make_request_payload())

    assert result.simple_summary == "Your report has one borderline value."
    assert result.questions_to_ask_doctor == ["Should I repeat this test fasting?"]


def test_retries_after_server_error() -> None:
    calls = {"count": 0}
    payload = {
        "simple_summary": "Summary after retry.",
        "detailed_explanation": "Explanation after retry.",
        "lifestyle_suggestions": ["Follow up."],
        "questions_to_ask_doctor": ["What should I monitor?"],
        "disclaimer": "This is not a diagnosis.",
    }

    def handler(_request: httpx.Request) -> httpx.Response:
        calls["count"] += 1
        if calls["count"] == 1:
            return httpx.Response(503, json={"error": "temporary"})
        return groq_response(payload)

    service = GroqSummaryService(make_settings(), client=httpx.Client(transport=httpx.MockTransport(handler)))

    result = service.generate_summary(*make_request_payload())

    assert result.simple_summary == "Summary after retry."
    assert calls["count"] == 2


def test_api_failure_after_retries() -> None:
    transport = httpx.MockTransport(lambda _request: httpx.Response(503, json={"error": "down"}))
    service = GroqSummaryService(make_settings(), client=httpx.Client(transport=transport))

    with pytest.raises(GroqAPIError, match="request failed"):
        service.generate_summary(*make_request_payload())


def test_timeout_failure() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("timeout")

    service = GroqSummaryService(make_settings(), client=httpx.Client(transport=httpx.MockTransport(handler)))

    with pytest.raises(GroqTimeoutError, match="timed out"):
        service.generate_summary(*make_request_payload())


def test_empty_response_failure() -> None:
    transport = httpx.MockTransport(lambda _request: httpx.Response(200, json={"choices": []}))
    service = GroqSummaryService(make_settings(), client=httpx.Client(transport=transport))

    with pytest.raises(GroqEmptyResponseError, match="empty response"):
        service.generate_summary(*make_request_payload())


def test_invalid_json_failure() -> None:
    transport = httpx.MockTransport(lambda _request: httpx.Response(200, json={"choices": [{"message": {"content": "not-json"}}]}))
    service = GroqSummaryService(make_settings(), client=httpx.Client(transport=transport))

    with pytest.raises(GroqInvalidJSONError, match="invalid JSON"):
        service.generate_summary(*make_request_payload())


def test_missing_json_fields_failure() -> None:
    transport = httpx.MockTransport(lambda _request: groq_response({"simple_summary": "Only one field"}))
    service = GroqSummaryService(make_settings(), client=httpx.Client(transport=transport))

    with pytest.raises(GroqInvalidJSONError, match="missing required fields"):
        service.generate_summary(*make_request_payload())
