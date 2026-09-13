from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.db import get_db
from models.models import Event, Incident, Bus, TrafficData, Route

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

ROAD_TYPES = ["POTHOLE", "WATERLOGGING", "DAMAGED_ROAD", "ROAD_DEBRIS", "OPEN_MANHOLE",
              "MISSING_ZEBRA_CROSSING", "MISSING_ROAD_DIVIDER", "DAMAGED_TRAFFIC_SIGN", "MISSING_TRAFFIC_SIGN"]


@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    buses = db.query(Bus).all()
    total = len(buses)
    online = sum(1 for b in buses if b.status == "online")
    offline = sum(1 for b in buses if b.status == "offline")
    warning = sum(1 for b in buses if b.status == "warning")

    events = db.query(Event).all()
    road_events = [e for e in events if e.event_type in ROAD_TYPES]
    potholes = sum(1 for e in road_events if e.event_type == "POTHOLE")
    waterlogging = sum(1 for e in road_events if e.event_type == "WATERLOGGING")
    infra_issues = sum(1 for e in road_events if e.event_type in (
        "MISSING_ZEBRA_CROSSING", "MISSING_ROAD_DIVIDER", "DAMAGED_TRAFFIC_SIGN", "MISSING_TRAFFIC_SIGN"
    ))

    traffic = db.query(TrafficData).all()
    total_vehicles = sum(t.vehicle_count for t in traffic)
    high_congestion = sum(1 for t in traffic if t.density_level in ("HIGH", "CRITICAL"))
    bottlenecks = sum(1 for t in traffic if t.is_bottleneck)

    incidents = db.query(Incident).all()
    active_incidents = sum(1 for i in incidents if i.status in ("NEW", "ACKNOWLEDGED", "ASSIGNED"))
    critical_incidents = sum(1 for i in incidents if i.severity == "CRITICAL" and i.status == "NEW")

    return {
        "fleet": {
            "total": total, "online": online, "offline": offline, "warning": warning,
        },
        "road_intelligence": {
            "total_defects": len(road_events),
            "potholes": potholes,
            "waterlogging": waterlogging,
            "infrastructure_issues": infra_issues,
        },
        "traffic": {
            "total_vehicles": total_vehicles,
            "high_congestion_zones": high_congestion,
            "active_bottlenecks": bottlenecks,
        },
        "safety": {
            "active_incidents": active_incidents,
            "pedestrian_risk_events": sum(1 for i in incidents if i.incident_type == "PEDESTRIAN_RISK"),
            "high_priority_alerts": critical_incidents,
        },
    }


@router.get("/routes")
def get_route_analytics(db: Session = Depends(get_db)):
    routes = db.query(Route).all()
    return {
        "routes": [
            {
                "id": r.id,
                "name": r.name,
                "bus_count": r.bus_count,
                "avg_speed": r.avg_speed,
                "expected_time_min": r.expected_time_min,
                "actual_time_min": r.actual_time_min,
                "delay_min": r.delay_min,
                "congestion_level": r.congestion_level,
                "distance_km": r.distance_km,
                "waypoints": r.waypoints,
            }
            for r in routes
        ]
    }


@router.get("/infrastructure")
def get_infra_analytics(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    return {
        "potholes": sum(1 for e in events if e.event_type == "POTHOLE"),
        "damaged_roads": sum(1 for e in events if e.event_type == "DAMAGED_ROAD"),
        "waterlogging": sum(1 for e in events if e.event_type == "WATERLOGGING"),
        "missing_signs": sum(1 for e in events if e.event_type == "MISSING_TRAFFIC_SIGN"),
        "damaged_signs": sum(1 for e in events if e.event_type == "DAMAGED_TRAFFIC_SIGN"),
        "missing_zebra_crossings": sum(1 for e in events if e.event_type == "MISSING_ZEBRA_CROSSING"),
        "missing_dividers": sum(1 for e in events if e.event_type == "MISSING_ROAD_DIVIDER"),
        "open_manholes": sum(1 for e in events if e.event_type == "OPEN_MANHOLE"),
        "road_debris": sum(1 for e in events if e.event_type == "ROAD_DEBRIS"),
        "total_events": len(events),
        "new": sum(1 for e in events if e.status == "NEW"),
        "verified": sum(1 for e in events if e.status == "VERIFIED"),
        "assigned": sum(1 for e in events if e.status == "ASSIGNED"),
        "resolved": sum(1 for e in events if e.status == "RESOLVED"),
        "by_bus": {
            bus_id: sum(1 for e in events if e.bus_id == bus_id)
            for bus_id in set(e.bus_id for e in events)
        },
    }


@router.get("/congestion")
def get_congestion_analytics(db: Session = Depends(get_db)):
    segments = db.query(TrafficData).all()
    # Simulated time-of-day data
    import random, datetime
    hours = list(range(6, 23))
    time_series = []
    for h in hours:
        label = f"{h:02d}:00"
        is_peak = h in (8, 9, 17, 18, 19)
        base = random.randint(150, 200) if is_peak else random.randint(60, 120)
        time_series.append({"time": label, "vehicles": base, "is_peak": is_peak})

    return {
        "segments": [
            {"name": s.segment_name, "level": s.density_level, "count": s.vehicle_count, "speed": s.avg_speed}
            for s in segments
        ],
        "time_series": time_series,
        "od_matrix": {
            "zones": ["Zone A\n(Station)", "Zone B\n(Pandri)", "Zone C\n(Civil Lines)", "Zone D\n(Tatibandh)", "Zone E\n(Mowa)"],
            "matrix": [
                [0, 420, 810, 380, 290],
                [320, 0, 590, 270, 410],
                [710, 430, 0, 550, 320],
                [360, 280, 540, 0, 190],
                [270, 390, 310, 210, 0],
            ]
        },
    }
