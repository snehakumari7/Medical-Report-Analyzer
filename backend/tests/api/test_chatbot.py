from fastapi.testclient import TestClient

from app.api.v1 import chatbot
from app.main import app
from app.schemas.chatbot import ChatbotResponse


client = TestClient(app)


def test_chatbot_requires_question() -> None:
    response = client.post("/chatbot", json={"question": ""})

    assert response.status_code == 422


def test_chatbot_returns_ai_answer(monkeypatch) -> None:
    class MockChatService:
        def answer_question(self, question, context, conversation):  # noqa: ANN001
            assert question == "What does my glucose mean?"
            assert context.health_score == 82
            return ChatbotResponse(
                answer="Your glucose is above the provided reference range, so discuss it with your doctor.",
                safety_note="This is educational information and not a diagnosis.",
            )

    monkeypatch.setattr(chatbot, "get_groq_chat_service", lambda: MockChatService())

    response = client.post(
        "/chatbot",
        json={
            "question": "What does my glucose mean?",
            "context": {
                "health_score": 82,
                "extracted_parameters": [
                    {
                        "parameter_name": "Glucose",
                        "value": 130,
                        "unit": "mg/dL",
                        "status": "high",
                        "severity": "high",
                        "reference_range": "70-99",
                    }
                ],
                "abnormal_values": [
                    {
                        "parameter_name": "Glucose",
                        "value": 130,
                        "unit": "mg/dL",
                        "status": "high",
                        "severity": "high",
                        "reference_range": "70-99",
                    }
                ],
                "report_filename": "blood-report.pdf",
            },
            "conversation": [],
        },
    )

    assert response.status_code == 200
    assert response.json()["answer"].startswith("Your glucose")
