from fastapi.testclient import TestClient

from app.main import app


def test_analyze_parameters_endpoint_success() -> None:
    client = TestClient(app)

    response = client.post(
        "/analyze-parameters",
        json={
            "parameters": [
                {"parameter_name": "Glucose", "value": 104, "unit": "mg/dL", "reference_range": "Fasting: 70-99 mg/dL", "confidence_score": 0.95},
                {"parameter_name": "LDL", "value": 160, "unit": "mg/dL", "reference_range": "<100 mg/dL", "confidence_score": 0.93},
            ]
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["health_score"] == 83
    assert body["parameters"][0]["parameter"] == "Glucose"
    assert body["parameters"][0]["status"] == "borderline_high"
    assert body["parameters"][1]["severity"] == "high"
    assert len(body["risk_indicators"]) == 2
    assert "does not diagnose diseases" in body["disclaimer"]


def test_analyze_parameters_endpoint_rejects_unknown_parameter() -> None:
    client = TestClient(app)

    response = client.post(
        "/analyze-parameters",
        json={"parameters": [{"parameter_name": "Calcium", "value": 9.2, "unit": "mg/dL"}]},
    )

    assert response.status_code == 400
    assert "No medical range configuration" in response.json()["detail"]
