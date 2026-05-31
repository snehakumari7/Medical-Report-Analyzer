from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app.core.config import get_settings
from app.main import app


def reset_settings() -> None:
    get_settings.cache_clear()


def make_png_bytes() -> bytes:
    buffer = BytesIO()
    image = Image.new("RGB", (8, 8), color=(21, 94, 117))
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_upload_png_success(tmp_path) -> None:
    reset_settings()
    settings = get_settings()
    settings.upload_dir = tmp_path
    client = TestClient(app)

    response = client.post(
        "/upload",
        files={"file": ("report.png", make_png_bytes(), "image/png")},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["file_id"]
    assert body["filename"] == "report.png"
    assert body["upload_time"]
    assert (tmp_path / f"{body['file_id']}.png").exists()


def test_reject_unsupported_file_type() -> None:
    reset_settings()
    client = TestClient(app)

    response = client.post(
        "/upload",
        files={"file": ("notes.txt", b"not a report", "text/plain")},
    )

    assert response.status_code == 415
    assert "Unsupported" in response.json()["detail"]


def test_reject_corrupted_image() -> None:
    reset_settings()
    client = TestClient(app)

    response = client.post(
        "/upload",
        files={"file": ("broken.jpg", b"not a real jpg", "image/jpeg")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Corrupted image file."


def test_reject_file_too_large(tmp_path) -> None:
    reset_settings()
    settings = get_settings()
    settings.upload_dir = tmp_path
    settings.max_upload_size_bytes = 4
    client = TestClient(app)

    response = client.post(
        "/upload",
        files={"file": ("report.pdf", b"%PDF-1.4 too large", "application/pdf")},
    )

    assert response.status_code == 413
    assert "File too large" in response.json()["detail"]
