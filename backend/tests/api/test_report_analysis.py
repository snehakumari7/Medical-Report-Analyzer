from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


def reset_settings() -> None:
    get_settings.cache_clear()


def test_analyze_uploaded_report_success(tmp_path: Path, monkeypatch) -> None:
    reset_settings()
    settings = get_settings()
    settings.upload_dir = tmp_path
    file_id = "a" * 32
    (tmp_path / f"{file_id}.pdf").write_bytes(b"%PDF-1.4")

    monkeypatch.setattr(
        "app.api.v1.report_analysis.get_ocr_service",
        lambda: type("OCR", (), {"extract_text": lambda self, path: "Glucose 104 mg/dL\nLDL 160 mg/dL"})(),
    )

    client = TestClient(app)
    response = client.post("/analyze-uploaded-report", json={"file_id": file_id, "filename": "report.pdf"})

    assert response.status_code == 200
    body = response.json()
    assert body["file_id"] == file_id
    assert body["raw_text"] == "Glucose 104 mg/dL\nLDL 160 mg/dL"
    assert len(body["extracted_parameters"]) == 2
    assert body["intelligence"]["health_score"] == 83
    assert body["intelligence"]["parameters"][0]["parameter"] == "LDL" or body["intelligence"]["parameters"][0]["parameter"] == "Glucose"


def test_analyze_uploaded_report_rejects_missing_file(tmp_path: Path) -> None:
    reset_settings()
    settings = get_settings()
    settings.upload_dir = tmp_path
    client = TestClient(app)

    response = client.post("/analyze-uploaded-report", json={"file_id": "b" * 32, "filename": "missing.pdf"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Uploaded file was not found on the server."


def test_analyze_uploaded_report_validates_file_id() -> None:
    client = TestClient(app)

    response = client.post("/analyze-uploaded-report", json={"file_id": "not-safe", "filename": "report.pdf"})

    assert response.status_code == 422
