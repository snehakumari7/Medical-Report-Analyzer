from datetime import datetime

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    file_id: str = Field(..., description="Server-generated identifier for the uploaded file")
    filename: str = Field(..., description="Original client filename")
    upload_time: datetime = Field(..., description="UTC timestamp when the file was stored")
