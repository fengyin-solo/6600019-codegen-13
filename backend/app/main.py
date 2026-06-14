from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import waveform_router

app = FastAPI(title="地震波形P/S波自动拾取分析", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(waveform_router.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
