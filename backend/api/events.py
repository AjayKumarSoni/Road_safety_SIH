from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.db import get_db
from models.models import Event
from typing import Optional
import datetime

router = APIRouter(prefix="/api/events", tags=["Events"])


def event_to_dict(e: Event) -> dict:
    return {
        "event_id": e.event_id,
        "bus_id": e.bus_id,
        "event_type": e.event_type,
        "confidence": e.confidence,
        "severity": e.severity,
        "lat": e.lat,
        "lng": e.lng,
        "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        "source": e.source,
        "evidence_url": e.evidence_url,
        "status": e.status,
        "description": e.description,
        "location_name": e.location_name,
        "metadata_json": e.metadata_json,
    }


@router.get("")
def get_events(
    bus_id: Optional[str] = None,
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    q = db.query(Event)
    if bus_id:
        q = q.filter(Event.bus_id == bus_id)
    if event_type:
        q = q.filter(Event.event_type == event_type)
    if severity:
        q = q.filter(Event.severity == severity)
    if status:
        q = q.filter(Event.status == status)
    total = q.count()
    events = q.order_by(Event.timestamp.desc()).offset(offset).limit(limit).all()
    return {"events": [event_to_dict(e) for e in events], "total": total}


@router.get("/{event_id}")
def get_event(event_id: str, db: Session = Depends(get_db)):
    e = db.query(Event).filter(Event.event_id == event_id).first()
    if not e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Event not found")
    return event_to_dict(e)


@router.put("/{event_id}")
def update_event(event_id: str, data: dict, db: Session = Depends(get_db)):
    e = db.query(Event).filter(Event.event_id == event_id).first()
    if not e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Event not found")
    for key, val in data.items():
        if hasattr(e, key):
            setattr(e, key, val)
    db.commit()
    return {"success": True, "event": event_to_dict(e)}


@router.post("")
def create_event(data: dict, db: Session = Depends(get_db)):
    import uuid, random
    event = Event(
        event_id=data.get("event_id", f"EVT-{random.randint(20000, 99999)}"),
        bus_id=data.get("bus_id", "BUS-001"),
        event_type=data.get("event_type", "POTHOLE"),
        confidence=data.get("confidence", 0.85),
        severity=data.get("severity", "MEDIUM"),
        lat=data.get("lat", 21.2514),
        lng=data.get("lng", 81.6296),
        source=data.get("source", "SIMULATED_EDGE"),
        description=data.get("description", ""),
        location_name=data.get("location_name", ""),
        status="NEW",
        metadata_json=data.get("metadata_json", {"simulated": True}),
    )
    db.add(event)
    db.commit()
    return {"success": True, "event_id": event.event_id}
