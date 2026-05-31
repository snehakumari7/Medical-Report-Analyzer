from pathlib import Path

import cv2
import numpy as np
import pdfplumber
import pytesseract
from PIL import UnidentifiedImageError
from pytesseract import TesseractError

from app.core.config import Settings, get_settings

SUPPORTED_OCR_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}


class OCRError(Exception):
    """Base exception for OCR failures that should be presented safely to API callers."""


class EmptyPDFError(OCRError):
    pass


class OCRFailureError(OCRError):
    pass


class LowQualityImageError(OCRError):
    pass


class UnsupportedEncodingError(OCRError):
    pass


class UnsupportedOCRFileTypeError(OCRError):
    pass


class OCRService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        if settings.tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd

    def extract_text(self, file_path: str | Path) -> str:
        path = Path(file_path)
        if not path.exists() or not path.is_file():
            raise OCRFailureError("Uploaded file could not be found for OCR processing.")

        extension = path.suffix.lower()
        if extension not in SUPPORTED_OCR_EXTENSIONS:
            raise UnsupportedOCRFileTypeError("OCR supports PDF, PNG, JPG, and JPEG files only.")

        if extension == ".pdf":
            return self._extract_pdf_text(path)

        return self._extract_image_text(path)

    def _extract_pdf_text(self, path: Path) -> str:
        try:
            with pdfplumber.open(path) as pdf:
                if len(pdf.pages) == 0:
                    raise EmptyPDFError("PDF contains no pages.")

                page_text = [page.extract_text() or "" for page in pdf.pages]
        except EmptyPDFError:
            raise
        except UnicodeError as exc:
            raise UnsupportedEncodingError("PDF text uses unsupported encoding.") from exc
        except Exception as exc:
            raise OCRFailureError("Unable to extract text from PDF.") from exc

        text = self._normalize_extracted_text("\n".join(page_text))
        if not text:
            raise EmptyPDFError("PDF contains no extractable text.")
        return text

    def _extract_image_text(self, path: Path) -> str:
        preprocessed_image = self._preprocess_image(path)

        try:
            text = pytesseract.image_to_string(preprocessed_image)
        except (TesseractError, RuntimeError, OSError) as exc:
            raise OCRFailureError("Tesseract OCR failed for the uploaded image.") from exc

        text = self._normalize_extracted_text(text)
        if not text:
            raise OCRFailureError("OCR completed but no text was detected.")
        return text

    def _preprocess_image(self, path: Path) -> np.ndarray:
        raw_image = cv2.imread(str(path))
        if raw_image is None:
            raise OCRFailureError("Uploaded image could not be decoded.")

        try:
            grayscale = cv2.cvtColor(raw_image, cv2.COLOR_BGR2GRAY)
        except (cv2.error, UnidentifiedImageError) as exc:
            raise OCRFailureError("Uploaded image could not be converted for OCR.") from exc

        height, width = grayscale.shape[:2]
        if min(height, width) < self.settings.ocr_min_image_dimension:
            raise LowQualityImageError("Image quality is too low for OCR. Upload a clearer image.")

        if float(np.std(grayscale)) < self.settings.ocr_low_contrast_threshold:
            raise LowQualityImageError("Image contrast is too low for OCR. Upload a clearer image.")

        denoised = cv2.fastNlMeansDenoising(grayscale, None, h=30, templateWindowSize=7, searchWindowSize=21)
        _threshold, thresholded = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return thresholded

    def _normalize_extracted_text(self, text: str) -> str:
        try:
            text.encode("utf-8")
        except UnicodeEncodeError as exc:
            raise UnsupportedEncodingError("Extracted text uses unsupported encoding.") from exc

        normalized_lines = [line.strip() for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
        return "\n".join(line for line in normalized_lines if line).strip()


def get_ocr_service() -> OCRService:
    return OCRService(get_settings())
