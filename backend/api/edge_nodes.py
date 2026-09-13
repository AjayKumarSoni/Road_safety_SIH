from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from models.models import Bus, BusDevice

router = APIRouter(prefix="/api/edge-nodes", tags=["Edge Hardware"])


@router.get("")
def get_edge_nodes(db: Session = Depends(get_db)):
    buses = db.query(Bus).all()
    nodes = []
    for bus in buses:
        device = db.query(BusDevice).filter(BusDevice.bus_id == bus.id).first()
        cameras_online = sum([
            device.camera_front if device else False,
            device.camera_rear if device else False,
            device.camera_left if device else False,
            device.camera_right if device else False,
        ]) if device else 0
        nodes.append({
            "bus_id": bus.id,
            "bus_name": bus.name,
            "route_name": bus.route_name,
            "status": bus.status,
            "device_type": "SIMULATED_EDGE",
            "device_model": "Raspberry Pi 4 (Simulated)",
            "ai_engine": "YOLO-compatible (Simulated)",
            "cpu_usage": round(device.cpu_usage, 1) if device else 0,
            "ram_usage": round(device.ram_usage, 1) if device else 0,
            "temperature": round(device.temperature, 1) if device else 0,
            "storage_usage": round(device.storage_usage, 1) if device else 0,
            "ai_fps": round(device.ai_fps, 1) if device else 0,
            "ai_status": device.ai_status if device else "OFFLINE",
            "gps_status": device.gps_status if device else "NO_SIGNAL",
            "imu_status": device.imu_status if device else "INACTIVE",
            "network_type": device.network_type if device else "NONE",
            "network_signal": device.network_signal if device else 0,
            "cameras_online": cameras_online,
            "cameras_total": 4,
            "camera_front": device.camera_front if device else False,
            "camera_rear": device.camera_rear if device else False,
            "camera_left": device.camera_left if device else False,
            "camera_right": device.camera_right if device else False,
            "bandwidth_saved_pct": 87,
            "events_per_min": round((device.ai_fps or 0) * 0.05, 1) if device else 0,
            "uptime_hours": 6 if bus.status != "offline" else 0,
            "last_seen": bus.last_seen.isoformat() if bus.last_seen else None,
        })
    return {"nodes": nodes, "total": len(nodes)}


@router.get("/{bus_id}")
def get_edge_node(bus_id: str, db: Session = Depends(get_db)):
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Edge node not found")
    device = db.query(BusDevice).filter(BusDevice.bus_id == bus_id).first()
    return {
        "bus_id": bus.id,
        "status": bus.status,
        "device_type": "SIMULATED_EDGE",
        "cpu_usage": round(device.cpu_usage, 1) if device else 0,
        "ram_usage": round(device.ram_usage, 1) if device else 0,
        "temperature": round(device.temperature, 1) if device else 0,
        "storage_usage": round(device.storage_usage, 1) if device else 0,
        "ai_fps": round(device.ai_fps, 1) if device else 0,
        "ai_status": device.ai_status if device else "OFFLINE",
        "gps_status": device.gps_status if device else "NO_SIGNAL",
        "network_signal": device.network_signal if device else 0,
        "cameras": {
            "front": device.camera_front if device else False,
            "rear": device.camera_rear if device else False,
            "left": device.camera_left if device else False,
            "right": device.camera_right if device else False,
        }
    }
