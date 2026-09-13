from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from models.models import Bus, BusDevice, Telemetry
from typing import List
import datetime

router = APIRouter(prefix="/api/buses", tags=["Fleet"])


def bus_to_dict(bus: Bus, device: BusDevice = None) -> dict:
    d = {
        "id": bus.id,
        "name": bus.name,
        "route_id": bus.route_id,
        "route_name": bus.route_name,
        "status": bus.status,
        "lat": bus.lat,
        "lng": bus.lng,
        "speed": round(bus.speed, 1),
        "heading": round(bus.heading, 1),
        "last_seen": bus.last_seen.isoformat() if bus.last_seen else None,
        "driver_name": bus.driver_name,
        "license_plate": bus.license_plate,
        "source": "SIMULATED_EDGE",
    }
    if device:
        d["device"] = {
            "camera_front": device.camera_front,
            "camera_rear": device.camera_rear,
            "camera_left": device.camera_left,
            "camera_right": device.camera_right,
            "gps_status": device.gps_status,
            "imu_status": device.imu_status,
            "network_type": device.network_type,
            "network_signal": device.network_signal,
            "ai_status": device.ai_status,
            "ai_fps": round(device.ai_fps, 1),
            "cpu_usage": round(device.cpu_usage, 1),
            "ram_usage": round(device.ram_usage, 1),
            "temperature": round(device.temperature, 1),
            "storage_usage": round(device.storage_usage, 1),
            "updated_at": device.updated_at.isoformat() if device.updated_at else None,
        }
    return d


@router.get("")
def get_buses(db: Session = Depends(get_db)):
    buses = db.query(Bus).all()
    result = []
    for bus in buses:
        device = db.query(BusDevice).filter(BusDevice.bus_id == bus.id).first()
        result.append(bus_to_dict(bus, device))
    return {"buses": result, "total": len(result)}


@router.get("/{bus_id}")
def get_bus(bus_id: str, db: Session = Depends(get_db)):
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    device = db.query(BusDevice).filter(BusDevice.bus_id == bus_id).first()
    return bus_to_dict(bus, device)


@router.put("/{bus_id}")
def update_bus(bus_id: str, data: dict, db: Session = Depends(get_db)):
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    for key, val in data.items():
        if hasattr(bus, key):
            setattr(bus, key, val)
    db.commit()
    return {"success": True}


@router.get("/{bus_id}/telemetry")
def get_telemetry(bus_id: str, limit: int = 50, db: Session = Depends(get_db)):
    records = (
        db.query(Telemetry)
        .filter(Telemetry.bus_id == bus_id)
        .order_by(Telemetry.timestamp.desc())
        .limit(limit)
        .all()
    )
    return {
        "bus_id": bus_id,
        "telemetry": [
            {
                "timestamp": r.timestamp.isoformat(),
                "lat": r.lat,
                "lng": r.lng,
                "speed": r.speed,
                "heading": r.heading,
                "cpu": r.cpu,
                "ram": r.ram,
                "temperature": r.temperature,
                "network_signal": r.network_signal,
                "ai_fps": r.ai_fps,
            }
            for r in records
        ],
    }
