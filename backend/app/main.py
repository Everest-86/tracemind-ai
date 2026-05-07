from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import PlainTextResponse, Response

from .database import get_analysis, init_db, list_analyses, save_analysis
from .schemas import (
    AnalysisListItem,
    GenerateQAPackageRequest,
    GenerateQAPackageResponse,
    GenerateRequest,
    RequirementAnalysis,
)
from .services.exporters import build_csv_report, build_txt_report
from .services.mock_generator import generate_outputs, generate_qa_package

logger = logging.getLogger(__name__)


def _allowed_origins() -> list[str]:
    configured = os.getenv("TRACEMIND_ALLOWED_ORIGINS", "").strip()
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="TraceMind AI API",
    version="0.1.0",
    summary="Structured QA artifact generation for workflow automation portfolio demos.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: object, exc: Exception) -> JSONResponse:
    logger.error(
        "Unhandled backend error",
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "TraceMind AI encountered an unexpected backend error."},
    )


def _analysis_or_404(analysis_id: int) -> RequirementAnalysis:
    analysis = get_analysis(analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return analysis


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "TraceMind AI API", "status": "ready"}


@app.get("/health")
@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/generate-qa-package", response_model=GenerateQAPackageResponse)
def create_qa_package(request: GenerateQAPackageRequest) -> GenerateQAPackageResponse:
    return generate_qa_package(request)


@app.get("/api/analyses", response_model=list[AnalysisListItem])
def get_recent_analyses() -> list[AnalysisListItem]:
    return list_analyses()


@app.post("/api/analyses", response_model=RequirementAnalysis, status_code=201)
def create_analysis(request: GenerateRequest) -> RequirementAnalysis:
    outputs = generate_outputs(request)
    return save_analysis(request, outputs)


@app.get("/api/analyses/{analysis_id}", response_model=RequirementAnalysis)
def read_analysis(analysis_id: int) -> RequirementAnalysis:
    return _analysis_or_404(analysis_id)


@app.get("/api/analyses/{analysis_id}/export/txt")
def export_txt(analysis_id: int) -> PlainTextResponse:
    analysis = _analysis_or_404(analysis_id)
    filename = f"tracemind-{analysis.outputs.requirement_reference.lower()}.txt"
    return PlainTextResponse(
        build_txt_report(analysis),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/analyses/{analysis_id}/export/csv")
def export_csv(analysis_id: int) -> Response:
    analysis = _analysis_or_404(analysis_id)
    filename = f"tracemind-{analysis.outputs.requirement_reference.lower()}.csv"
    return Response(
        content=build_csv_report(analysis),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
