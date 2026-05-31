from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import AISummary, ExtractedParameter, HealthScore, Report, User  # noqa: F401


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_full_medical_records_crud_flow(client: TestClient) -> None:
    user_response = client.post("/users", json={"email": "Patient@example.com", "full_name": "Patient One", "is_active": True})
    assert user_response.status_code == 201
    user = user_response.json()
    assert user["email"] == "patient@example.com"

    assert client.get("/users").status_code == 200
    assert client.get(f"/users/{user['id']}").json()["full_name"] == "Patient One"

    updated_user = client.patch(f"/users/{user['id']}", json={"full_name": "Patient Updated"}).json()
    assert updated_user["full_name"] == "Patient Updated"

    report_payload = {
        "user_id": user["id"],
        "original_filename": "report.pdf",
        "storage_path": "storage/uploads/report.pdf",
        "file_type": "pdf",
        "file_size_bytes": 1024,
        "processing_status": "uploaded",
    }
    report_response = client.post("/reports", json=report_payload)
    assert report_response.status_code == 201
    report = report_response.json()

    assert client.get("/reports").status_code == 200
    assert client.get(f"/reports/{report['id']}").json()["original_filename"] == "report.pdf"
    updated_report = client.patch(f"/reports/{report['id']}", json={"processing_status": "analyzed"}).json()
    assert updated_report["processing_status"] == "analyzed"

    parameter_payload = {
        "report_id": report["id"],
        "parameter_name": "Glucose",
        "value": 104,
        "unit": "mg/dL",
        "reference_range": "70-99 mg/dL",
        "confidence_score": 0.95,
        "extraction_log": {"matched_text": "Glucose 104 mg/dL"},
    }
    parameter_response = client.post("/extracted-parameters", json=parameter_payload)
    assert parameter_response.status_code == 201
    parameter = parameter_response.json()

    assert client.get("/extracted-parameters").status_code == 200
    assert client.get(f"/extracted-parameters/{parameter['id']}").json()["parameter_name"] == "Glucose"
    updated_parameter = client.patch(f"/extracted-parameters/{parameter['id']}", json={"value": 108}).json()
    assert updated_parameter["value"] == 108

    score_payload = {
        "report_id": report["id"],
        "score": 88,
        "risk_level": "moderate",
        "risk_indicators": [{"parameter": "Glucose", "severity": "borderline"}],
    }
    score_response = client.post("/health-scores", json=score_payload)
    assert score_response.status_code == 201
    score = score_response.json()

    assert client.get("/health-scores").status_code == 200
    assert client.get(f"/health-scores/{score['id']}").json()["score"] == 88
    updated_score = client.patch(f"/health-scores/{score['id']}", json={"score": 90, "risk_level": "low"}).json()
    assert updated_score["score"] == 90
    assert updated_score["risk_level"] == "low"

    summary_payload = {
        "report_id": report["id"],
        "summary_text": "Glucose is borderline high. This is not a diagnosis.",
        "model_name": "groq-test",
        "summary_type": "patient_friendly",
    }
    summary_response = client.post("/ai-summaries", json=summary_payload)
    assert summary_response.status_code == 201
    summary = summary_response.json()

    assert client.get("/ai-summaries").status_code == 200
    assert client.get(f"/ai-summaries/{summary['id']}").json()["model_name"] == "groq-test"
    updated_summary = client.patch(f"/ai-summaries/{summary['id']}", json={"summary_type": "clinician_review"}).json()
    assert updated_summary["summary_type"] == "clinician_review"

    assert client.delete(f"/ai-summaries/{summary['id']}").status_code == 204
    assert client.delete(f"/health-scores/{score['id']}").status_code == 204
    assert client.delete(f"/extracted-parameters/{parameter['id']}").status_code == 204
    assert client.delete(f"/reports/{report['id']}").status_code == 204
    assert client.delete(f"/users/{user['id']}").status_code == 204

    assert client.get(f"/users/{user['id']}").status_code == 404


def test_crud_validation_rejects_invalid_payloads(client: TestClient) -> None:
    invalid_user = client.post("/users", json={"email": "not-an-email", "full_name": "Bad Email"})
    assert invalid_user.status_code == 422

    invalid_report = client.post(
        "/reports",
        json={
            "user_id": "0" * 32,
            "original_filename": "report.exe",
            "storage_path": "storage/uploads/report.exe",
            "file_type": "exe",
            "file_size_bytes": 0,
            "processing_status": "uploaded",
        },
    )
    assert invalid_report.status_code == 422

    missing_report_parameter = client.post(
        "/extracted-parameters",
        json={
            "report_id": "0" * 32,
            "parameter_name": "Glucose",
            "value": 104,
            "unit": "mg/dL",
            "confidence_score": 0.95,
        },
    )
    assert missing_report_parameter.status_code == 400
    assert missing_report_parameter.json()["detail"] == "Referenced report does not exist."
