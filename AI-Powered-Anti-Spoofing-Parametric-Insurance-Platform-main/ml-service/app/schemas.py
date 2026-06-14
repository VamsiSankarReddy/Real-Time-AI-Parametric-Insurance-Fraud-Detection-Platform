from datetime import datetime
from pydantic import BaseModel, Field


class Vector3(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


class GPSLocation(BaseModel):
    lat: float
    lon: float
    speed: float = 0.0
    route_deviation: float = 0.0
    idle_time: float = 0.0


class SensorData(BaseModel):
    accelerometer: Vector3
    gyroscope: Vector3


class NetworkData(BaseModel):
    ip: str
    isp: str = "unknown"
    vpn: bool = False


class ClaimInput(BaseModel):
    user_id: str = Field(..., min_length=1)
    gps_location: GPSLocation
    sensor_data: SensorData
    network_data: NetworkData
    timestamp: datetime


class EvaluationResponse(BaseModel):
    trust_score: float
    status: str
    fraud_flags: list[str]
    fraud_evidence: list[dict]
    component_scores: dict
