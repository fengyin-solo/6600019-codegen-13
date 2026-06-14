from pydantic import BaseModel
from typing import List, Optional


class PhasePick(BaseModel):
    id: str
    type: str  # 'P' or 'S'
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
