from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.schemas.report_analysis import AnalyzeUploadedReportRequest, AnalyzeUploadedReportResponse
from app.services.medical_intelligence_service import MedicalIntelligenceError, get_medical_intelligence_engine
from app.services.ocr_service import OCRError, get_ocr_service
from app.services.parameter_parser import ParameterParserError, get_parameter_parser

router = APIRouter(tags=["Report Analysis"])


@router.post(
    "/analyze-uploaded-report",
    response_model=AnalyzeUploadedReportResponse,
    summary="Extract and analyze an uploaded medical report",
    description="Runs OCR, regex parameter extraction, and abnormality classification for a previously uploaded file. This endpoint does not diagnose disease.",
)
def analyze_uploaded_report(payload: AnalyzeUploadedReportRequest) -> AnalyzeUploadedReportResponse:
    file_path = resolve_uploaded_file_path(payload.file_id, payload.filename)

    try:
        raw_text = get_ocr_service().extract_text(file_path)
        parsed = get_parameter_parser().parse(raw_text)
        intelligence = get_medical_intelligence_engine().analyze(parsed["parameters"])
    except OCRError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except (ParameterParserError, MedicalIntelligenceError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return AnalyzeUploadedReportResponse(
        file_id=payload.file_id,
        filename=payload.filename,
        raw_text=raw_text,
        extracted_parameters=parsed["parameters"],
        extraction_logs=parsed["extraction_logs"],
        intelligence=intelligence,
    )


def resolve_uploaded_file_path(file_id: str, filename: str) -> Path:
    extension = Path(filename).suffix.lower()
    if extension not in {".pdf", ".png", ".jpg", ".jpeg"}:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported uploaded report type.")

    settings = get_settings()
    upload_dir = settings.resolved_upload_dir.resolve()
    file_path = (upload_dir / f"{file_id}{extension}").resolve()

    if upload_dir not in file_path.parents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid uploaded file path.")

    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Uploaded file was not found on the server.")

    return file_path
