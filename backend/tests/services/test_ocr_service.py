from pathlib import Path

import cv2
import numpy as np
import pytest
from pytesseract import TesseractError

from app.core.config import get_settings
from app.services.ocr_service import (
    EmptyPDFError,
    LowQualityImageError,
    OCRFailureError,
    OCRService,
    UnsupportedEncodingError,
    UnsupportedOCRFileTypeError,
)


class FakePage:
    def __init__(self, text: str | None) -> None:
        self.text = text

    def extract_text(self) -> str | None:
        return self.text


class FakePDF:
    def __init__(self, pages: list[FakePage]) -> None:
        self.pages = pages

    def __enter__(self) -> "FakePDF":
        return self

    def __exit__(self, _exc_type, _exc_value, _traceback) -> None:
        return None


def make_service(tmp_path: Path) -> OCRService:
    get_settings.cache_clear()
    settings = get_settings()
    settings.upload_dir = tmp_path
    settings.ocr_min_image_dimension = 50
    settings.ocr_low_contrast_threshold = 8.0
    return OCRService(settings)


def write_quality_image(path: Path) -> None:
    image = np.full((140, 360, 3), 255, dtype=np.uint8)
    cv2.putText(image, "Hemoglobin 13.5", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2, cv2.LINE_AA)
    cv2.imwrite(str(path), image)


def test_extract_pdf_text_success(tmp_path, monkeypatch) -> None:
    pdf_path = tmp_path / "report.pdf"
    pdf_path.write_bytes(b"%PDF-1.4")
    monkeypatch.setattr("app.services.ocr_service.pdfplumber.open", lambda _path: FakePDF([FakePage("Glucose 92 mg/dL")]))

    text = make_service(tmp_path).extract_text(pdf_path)

    assert text == "Glucose 92 mg/dL"


def test_empty_pdf_raises_clear_error(tmp_path, monkeypatch) -> None:
    pdf_path = tmp_path / "empty.pdf"
    pdf_path.write_bytes(b"%PDF-1.4")
    monkeypatch.setattr("app.services.ocr_service.pdfplumber.open", lambda _path: FakePDF([]))

    with pytest.raises(EmptyPDFError, match="no pages"):
        make_service(tmp_path).extract_text(pdf_path)


def test_pdf_without_extractable_text_raises_empty_pdf(tmp_path, monkeypatch) -> None:
    pdf_path = tmp_path / "blank.pdf"
    pdf_path.write_bytes(b"%PDF-1.4")
    monkeypatch.setattr("app.services.ocr_service.pdfplumber.open", lambda _path: FakePDF([FakePage(None), FakePage("")]))

    with pytest.raises(EmptyPDFError, match="no extractable text"):
        make_service(tmp_path).extract_text(pdf_path)


def test_unsupported_encoding_raises_clear_error(tmp_path, monkeypatch) -> None:
    pdf_path = tmp_path / "encoded.pdf"
    pdf_path.write_bytes(b"%PDF-1.4")
    monkeypatch.setattr("app.services.ocr_service.pdfplumber.open", lambda _path: FakePDF([FakePage("Bad surrogate \ud800")]))

    with pytest.raises(UnsupportedEncodingError, match="unsupported encoding"):
        make_service(tmp_path).extract_text(pdf_path)


def test_extract_image_text_success(tmp_path, monkeypatch) -> None:
    image_path = tmp_path / "report.png"
    write_quality_image(image_path)
    monkeypatch.setattr("app.services.ocr_service.pytesseract.image_to_string", lambda _image: "Hemoglobin 13.5\n")

    text = make_service(tmp_path).extract_text(image_path)

    assert text == "Hemoglobin 13.5"


def test_low_quality_image_raises_clear_error(tmp_path) -> None:
    image_path = tmp_path / "low-quality.png"
    cv2.imwrite(str(image_path), np.full((20, 20, 3), 255, dtype=np.uint8))

    with pytest.raises(LowQualityImageError, match="too low"):
        make_service(tmp_path).extract_text(image_path)


def test_ocr_failure_raises_clear_error(tmp_path, monkeypatch) -> None:
    image_path = tmp_path / "report.jpg"
    write_quality_image(image_path)

    def fail_ocr(_image):
        raise TesseractError(1, "ocr failed")

    monkeypatch.setattr("app.services.ocr_service.pytesseract.image_to_string", fail_ocr)

    with pytest.raises(OCRFailureError, match="Tesseract OCR failed"):
        make_service(tmp_path).extract_text(image_path)


def test_unsupported_extension_raises_clear_error(tmp_path) -> None:
    file_path = tmp_path / "report.txt"
    file_path.write_text("not supported", encoding="utf-8")

    with pytest.raises(UnsupportedOCRFileTypeError, match="PDF, PNG, JPG, and JPEG"):
        make_service(tmp_path).extract_text(file_path)
