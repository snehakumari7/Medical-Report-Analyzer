from fastapi.testclient import TestClient

from app.main import app
from app.schemas.ai_summary import GenerateAISummaryResponse


class FakeGroqSummaryService:
    def generate_summary(self, extracted_parameters, health_score, abnormal_values):
        return GenerateAISummaryResponse(
            simple_summary=f"Health score is {health_score}.",
            detailed_explanation="One value needs monitoring. This does not diagnose disease.",
            lifestyle_suggestions=["Keep a consistent routine."],
            questions_to_ask_doctor=["Should I repeat this test?"],
            disclaimer="This output is educational and does not diagnose diseases.",
        )


def test_generate_ai_summary_endpoint_success(monkeypatch) -> None:
    monkeypatch.setattr("app.api.v1.ai_summary.get_groq_summary_service", lambda: FakeGroqSummaryService())
    client = TestClient(app)

    response = client.post(
        "/generate-ai-summary",
        json={
            "health_score": 95,
            "extracted_parameters": [
                {
                    "parameter_name": "Glucose",
                    "value": 104,
                    "unit": "mg/dL",
                    "status": "borderline_high",
                    "severity": "borderline",
                    "reference_range": "70-99 mg/dL",
                }
            ],
            "abnormal_values": [
                {
                    "parameter_name": "Glucose",
                    "value": 104,
                    "unit": "mg/dL",
                    "status": "borderline_high",
                    "severity": "borderline",
                    "reference_range": "70-99 mg/dL",
                }
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["simple_summary"] == "Health score is 95."
    assert body["lifestyle_suggestions"] == ["Keep a consistent routine."]
    assert "does not diagnose" in body["disclaimer"]


def test_generate_ai_summary_endpoint_validates_payload() -> None:
    client = TestClient(app)

    response = client.post("/generate-ai-summary", json={"health_score": 200, "extracted_parameters": []})

    assert response.status_code == 422
