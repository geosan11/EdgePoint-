"""
EdgePoint+ Main Service Entrypoint
Supports:
1. FastAPI web server exposing REST endpoints for predictions, parlays, and EdgeRadar
2. Standalone CLI background worker (daemon or cron mode)
"""

import argparse
import asyncio
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Header, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import settings
from models import CuratedParlay, LineMovement, ModelPrediction, Sport, Tier
from supabase_sync import PipelineOrchestrator

orchestrator = PipelineOrchestrator()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initial pipeline run on startup
    print("[Startup] Triggering initial quantitative modeling cycle...")
    await orchestrator.run_pipeline()
    yield
    print("[Shutdown] Shutting down EdgePoint+ backend...")


app = FastAPI(
    title="EdgePoint+ Quantitative API",
    description="+EV Sports Analytics, Mathematical Modeling, and Correlated Parlay Engine",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local and mobile app development.
# "*" (the default) is dev-only and cannot carry credentials per the CORS spec;
# set ALLOWED_ORIGINS to a real comma-separated origin list to enable credentialed requests.
_is_wildcard_origin = settings.ALLOWED_ORIGINS.strip() == "*"
_allowed_origins = (
    ["*"] if _is_wildcard_origin
    else [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=not _is_wildcard_origin,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "mock_mode": settings.MOCK_MODE,
        "supabase_connected": orchestrator.supabase is not None,
        "cached_predictions_count": len(orchestrator.cached_predictions)
    }


def _has_pro_access(x_api_key: Optional[str]) -> bool:
    """
    True when INTERNAL_API_KEY is unset (open dev mode) or the caller supplied a
    matching X-API-Key. This backend is an internal ingestion/ops surface -- the
    mobile app talks to Supabase directly and its RLS policies are the real
    per-user Pro gate -- but callers of this API should still not get Pro data
    for free once INTERNAL_API_KEY is configured.
    """
    return not settings.INTERNAL_API_KEY or x_api_key == settings.INTERNAL_API_KEY


@app.get("/api/predictions", response_model=List[ModelPrediction])
async def get_predictions(
    sport: Optional[Sport] = None,
    tier: Optional[Tier] = None,
    min_edge_score: float = Query(default=0.0, ge=0.0, le=100.0),
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key")
):
    """
    Returns filtered model predictions.
    Callers without a valid X-API-Key (when INTERNAL_API_KEY is configured) only
    ever receive tier=free picks, regardless of the requested `tier` filter.
    """
    preds = orchestrator.cached_predictions
    if not _has_pro_access(x_api_key):
        preds = [p for p in preds if p.tier == Tier.FREE]
    if sport:
        preds = [p for p in preds if p.sport == sport]
    if tier:
        preds = [p for p in preds if p.tier == tier]
    if min_edge_score > 0:
        preds = [p for p in preds if p.edge_score >= min_edge_score]
    return preds


@app.get("/api/parlay/daily", response_model=Optional[CuratedParlay])
async def get_daily_parlay(x_api_key: Optional[str] = Header(default=None, alias="X-API-Key")):
    """
    Returns the PointBlank Daily Slip. The slip is always tier=pro, so callers
    without a valid X-API-Key (when INTERNAL_API_KEY is configured) get None.
    """
    if not _has_pro_access(x_api_key):
        return None
    if orchestrator.cached_parlays:
        return orchestrator.cached_parlays[0]
    return None


@app.get("/api/radar", response_model=List[LineMovement])
async def get_radar():
    """
    Returns EdgeRadar line movements and steam alerts.
    """
    return orchestrator.cached_radar


@app.post("/api/run-pipeline")
async def trigger_run():
    """
    Triggers an on-demand ingestion and modeling run.
    """
    result = await orchestrator.run_pipeline()
    return {"message": "Pipeline cycle executed successfully", "summary": result}


# CLI Worker Execution
async def run_worker_loop(interval_minutes: int):
    print(f"Starting EdgePoint+ daemon worker polling every {interval_minutes} minutes...")
    while True:
        try:
            await orchestrator.run_pipeline()
        except Exception as e:
            print(f"[Worker Error] {e}")
        await asyncio.sleep(interval_minutes * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="EdgePoint+ Backend Runner")
    parser.add_argument("--server", action="store_true", help="Start FastAPI REST server")
    parser.add_argument("--run-once", action="store_true", help="Execute single pipeline run and exit")
    parser.add_argument("--daemon", action="store_true", help="Run background daemon polling")
    parser.add_argument("--port", type=int, default=8000, help="Port for REST server")
    parser.add_argument("--interval", type=int, default=settings.POLL_INTERVAL_MINUTES, help="Polling interval in minutes")

    args = parser.parse_args()

    if args.run_once:
        asyncio.run(orchestrator.run_pipeline())
    elif args.daemon:
        asyncio.run(run_worker_loop(args.interval))
    else:
        # Default: Start FastAPI server
        uvicorn.run("main:app", host="0.0.0.0", port=args.port, reload=True)
