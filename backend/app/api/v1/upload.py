from fastapi import APIRouter, Depends, File, UploadFile, status

from app.schemas.upload import UploadResponse
from app.services.file_upload_service import FileUploadService, get_file_upload_service

router = APIRouter(tags=["File Upload"])


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a medical report file",
    description="Accepts PDF, PNG, JPG, and JPEG files up to 20MB. Corrupted or unsupported files are rejected.",
)
async def upload_medical_report(
    file: UploadFile = File(..., description="Medical report file in PDF, PNG, JPG, or JPEG format"),
    service: FileUploadService = Depends(get_file_upload_service),
) -> UploadResponse:
    return await service.store_upload(file)
