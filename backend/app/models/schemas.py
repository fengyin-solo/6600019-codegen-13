from pydantic import BaseModel
from typing import List, Optional, Any


class PhasePick(BaseModel):
    id: str
    type: str
    time: float
    confidence: float
    method: str


class Station(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    elevation: float


class SeismicEvent(BaseModel):
    id: str
    magnitude: float
    depth: float
    origin_time: str
    location: str


class UploadHistorySummary(BaseModel):
    id: str
    filename: str
    upload_time: str
    pick_count: int


class UploadHistoryDetail(BaseModel):
    id: str
    filename: str
    upload_time: str
    waveform: Any
    picks: List[PhasePick]
