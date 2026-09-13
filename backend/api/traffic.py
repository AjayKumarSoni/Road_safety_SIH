from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from models.models import TrafficData

router = APIRouter(prefix="/api/traffic", tags=["Traffic"])


@router.get("")
def get_traffic(db: Session = Depends(get_db)):
    segs = db.query(TrafficData).order_by(TrafficData.timestamp.desc()).all()
    return {
        "segments": [
            {
                "segment_id": s.segment_id,
                "segment_name": s.segment_name,
                "lat": s.lat,
                "lng": s.lng,
                "density_level": s.density_level,
                "vehicle_count": s.vehicle_count,
                "avg_speed": round(s.avg_speed, 1),
                "cars": s.cars,
                "bikes": s.bikes,
                "buses": s.buses,
                "trucks": s.trucks,
                "autos": s.autos,
                "is_bottleneck": s.is_bottleneck,
                "bottleneck_duration_min": s.bottleneck_duration_min,
                "timestamp": s.timestamp.isoformat() if s.timestamp else None,
            }
            for s in segs
        ]
    }


@router.get("/density")
def get_density(db: Session = Depends(get_db)):
    segs = db.query(TrafficData).all()
    total = sum(s.vehicle_count for s in segs)
    critical = sum(1 for s in segs if s.density_level == "CRITICAL")
    high = sum(1 for s in segs if s.density_level == "HIGH")
    medium = sum(1 for s in segs if s.density_level == "MEDIUM")
    low = sum(1 for s in segs if s.density_level == "LOW")
    return {
        "total_vehicles": total,
        "critical_zones": critical,
        "high_zones": high,
        "medium_zones": medium,
        "low_zones": low,
        "overall": "CRITICAL" if critical > 0 else ("HIGH" if high > 1 else "MEDIUM"),
    }


@router.get("/bottlenecks")
def get_bottlenecks(db: Session = Depends(get_db)):
    bottlenecks = db.query(TrafficData).filter(TrafficData.is_bottleneck == True).all()
    return {
        "bottlenecks": [
            {
                "segment_id": b.segment_id,
                "segment_name": b.segment_name,
                "lat": b.lat,
                "lng": b.lng,
                "density_level": b.density_level,
                "avg_speed": round(b.avg_speed, 1),
                "vehicle_count": b.vehicle_count,
                "duration_min": b.bottleneck_duration_min,
            }
            for b in bottlenecks
        ],
        "total": len(bottlenecks),
    }


@router.get("/heatmap")
def get_heatmap(db: Session = Depends(get_db)):
    segs = db.query(TrafficData).all()
    return {
        "heatmap_points": [
            {"lat": s.lat, "lng": s.lng, "intensity": s.vehicle_count / 250.0}
            for s in segs
        ]
    }
