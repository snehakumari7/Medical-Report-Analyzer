from datetime import UTC, datetime
from io import BytesIO
from pathlib import Path
from uuid import uuid4

import pdfplumber
from fastapi import HTTPException, UploadFile, status
from PIL import Image

from app.core.config import Settings, get_settings
from app.schemas.upload import UploadResponse

SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
SUPPORTED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
}


class FileUploadService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def store_upload(self, upload_file: UploadFile) -> UploadResponse:
        original_filename = self._validate_filename(upload_file.filename)
        extension = Path(original_filename).suffix.lower()
        self._validate_declared_type(extension, upload_file.content_type)

        content = await self._read_with_size_limit(upload_file)
        self._validate_file_integrity(extension, content)

        upload_time = datetime.now(UTC)
        file_id = uuid4().hex
        safe_filename = f"{file_id}{extension}"
        storage_dir = self.settings.resolved_upload_dir
        storage_dir.mkdir(parents=True, exist_ok=True)
        target_path = storage_dir / safe_filename
        target_path.write_bytes(content)

        return UploadResponse(file_id=file_id, filename=original_filename, upload_time=upload_time)

    def _validate_filename(self, filename: str | None) -> str:
        if not filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A filename is required.")

        original_filename = Path(filename).name
        extension = Path(original_filename).suffix.lower()
        if extension not in SUPPORTED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported file type. Upload a PDF, PNG, JPG, or JPEG file.",
            )
        return original_filename

    def _validate_declared_type(self, extension: str, content_type: str | None) -> None:
        if not content_type:
            return

        normalized_content_type = content_type.split(";")[0].strip().lower()
        if normalized_content_type not in SUPPORTED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported media type. Upload a PDF, PNG, JPG, or JPEG file.",
            )

        if extension == ".pdf" and normalized_content_type != "application/pdf":
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="File extension and media type do not match.")

        if extension in {".png"} and normalized_content_type != "image/png":
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="File extension and media type do not match.")

        if extension in {".jpg", ".jpeg"} and normalized_content_type != "image/jpeg":
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="File extension and media type do not match.")

    async def _read_with_size_limit(self, upload_file: UploadFile) -> bytes:
        content = await upload_file.read(self.settings.max_upload_size_bytes + 1)
        if len(content) > self.settings.max_upload_size_bytes:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large. Maximum upload size is 20MB.")

        if not content:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty or corrupted.")

        return content

    def _validate_file_integrity(self, extension: str, content: bytes) -> None:
        if extension == ".pdf":
            self._validate_pdf(content)
            return

        self._validate_image(content)

    def _validate_pdf(self, content: bytes) -> None:
        try:
            with pdfplumber.open(BytesIO(content)) as pdf:
                if len(pdf.pages) == 0:
                    raise ValueError("PDF has no pages.")
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Corrupted PDF file.") from exc

    def _validate_image(self, content: bytes) -> None:
        try:
            with Image.open(BytesIO(content)) as image:
                image.verify()
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Corrupted image file.") from exc


def get_file_upload_service() -> FileUploadService:
    return FileUploadService(get_settings())
