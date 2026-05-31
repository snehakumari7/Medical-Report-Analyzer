from fastapi import APIRouter

from app.api.v1.ai_summary import router as ai_summary_router
from app.api.v1.medical_intelligence import router as medical_intelligence_router
from app.api.v1.medical_records import router as medical_records_router
from app.api.v1.report_analysis import router as report_analysis_router
from app.api.v1.upload import router as upload_router

api_router = APIRouter()
api_router.include_router(ai_summary_router)
api_router.include_router(medical_intelligence_router)
api_router.include_router(medical_records_router)
api_router.include_router(report_analysis_router)
api_router.include_router(upload_router)
