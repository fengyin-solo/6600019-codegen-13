from fastapi import APIRouter, UploadFile, File
from app.services.seismic_service import process_waveform

router = APIRouter()


@router.post("/waveform/upload")
async def upload_waveform(file: UploadFile = File(...)):
    """Upload SAC/miniSEED file and run analysis."""
    content = await file.read()
    result = process_waveform(content, file.filename or "unknown")
    return result


@router.get("/waveform/stations")
def get_stations():
    """Get station list."""
    return [
        {"id": "STA01", "name": "BJI", "latitude": 39.9, "longitude": 116.4, "elevation": 45},
        {"id": "STA02", "name": "SSE", "latitude": 31.2, "longitude": 121.5, "elevation": 10},
    ]


@router.get("/waveform/events")
def get_events():
    """Get seismic event catalog."""
    return [
        {"id": "1", "magnitude": 4.2, "depth": 12.5, "location": "四川雅安"},
        {"id": "2", "magnitude": 3.8, "depth": 8.3, "location": "云南大理"},
    ]
