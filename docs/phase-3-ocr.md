# Phase 3 OCR Module

## What Was Added

- `backend/app/services/ocr_service.py`
- PDF text extraction with `pdfplumber`
- Image OCR with Tesseract through `pytesseract`
- Image preprocessing with OpenCV:
  - grayscale conversion
  - denoising
  - Otsu thresholding
- OCR-specific error classes
- Unit tests for success and failure paths

## Input

The OCR service accepts a path to a file that was already uploaded and stored locally:

```python
from app.services.ocr_service import get_ocr_service

text = get_ocr_service().extract_text("storage/uploads/example.pdf")
```

## Output

Raw extracted text as a string.

No medical parameter extraction is implemented in this phase.

## Error Handling

| Error | Raised When |
| --- | --- |
| `EmptyPDFError` | PDF has no pages or no extractable text. |
| `OCRFailureError` | Tesseract fails, file cannot be decoded, or OCR returns no text. |
| `LowQualityImageError` | Image is too small or too low contrast for OCR. |
| `UnsupportedEncodingError` | Extracted text cannot be safely encoded as UTF-8. |
| `UnsupportedOCRFileTypeError` | File extension is not PDF, PNG, JPG, or JPEG. |

## Run Tests

```bash
cd backend
.venv\Scripts\activate
pytest tests/services/test_ocr_service.py
```

## Troubleshooting

### Tesseract OCR fails

Cause: Tesseract is not installed or the executable path is not configured.

Fix:

```text
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

### Low-quality image error

Cause: The image is too small, blurry, blank, or too low contrast.

Fix: Upload a clearer scan or photo. You can tune local thresholds:

```text
OCR_MIN_IMAGE_DIMENSION=50
OCR_LOW_CONTRAST_THRESHOLD=8.0
```

### Empty PDF error

Cause: The PDF has no embedded text. It may be a scanned image-only PDF.

Fix: Image-only PDF OCR will be handled in a later milestone. For now, upload a text-based PDF or an image file.
