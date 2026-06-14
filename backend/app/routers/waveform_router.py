from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.seismic_service import process_waveform, save_history, list_history, get_history

router = APIRouter()


@router.post("/waveform/upload")
async def upload_waveform(file: UploadFile = File(...)):
    content = await file.read()
    result = process_waveform(content, file.filename or "unknown")
    save_history(file.filename or "unknown", result["waveform"], result["picks"])
    return result


@router.get("/history")
def get_upload_history():
    return list_history()


@router.get("/history/{record_id}")
def get_history_detail(record_id: str):
    record = get_history(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="History record not found")
    return record


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
