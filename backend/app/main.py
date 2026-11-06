import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.database import engine
from app.core.scheduler import start_scheduler, scheduler
from app.api.v1.router import api_router

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 {settings.APP_NAME} starting in {settings.APP_ENV} mode")
    start_scheduler()  # <-- Starts the weekly CRON job
    
    yield
    
    # Shutdown
    scheduler.shutdown()
    await engine.dispose()
    print(f"👋 {settings.APP_NAME} shutting down")

app = FastAPI(
    title=settings.APP_NAME,
    description="Direct E-Commerce & Custom Household Food Procurement for Abuja.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Register API Router
app.include_router(api_router, prefix="/api/v1")

@app.get("/", tags=["System"])
async def root():
    return {"app": settings.APP_NAME, "status": "online", "docs": "/docs"}