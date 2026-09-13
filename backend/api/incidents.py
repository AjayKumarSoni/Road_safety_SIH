from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from models.models import Incident

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


def inc_to_dict(i: Incident) -> dict:
    return {
        "incident_id": i.incident_id,
        "bus_id": i.bus_id,
        "incident_type": i.incident_type,
        "vehicle_type": i.vehicle_type,
        "vehicle_id": i.vehicle_id,
        "registration": i.registration,
        "confidence": i.confidence,
        "severity": i.severity,
        "lat": i.lat,
        "lng": i.lng,
        "timestamp": i.timestamp.isoformat() if i.timestamp else None,
        "evidence_url": i.evidence_url,
        "status": i.status,
        "notes": i.notes,
        "location_name": i.location_name,
        "assigned_to": i.assigned_to,
        "source": "SIMULATED_EDGE",
    }


@router.get("")
def get_incidents(
    bus_id: str = None,
    incident_type: str = None,
    severity: str = None,
    status: str = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    q = db.query(Incident)
    if bus_id:
        q = q.filter(Incident.bus_id == bus_id)
    if incident_type:
        q = q.filter(Incident.incident_type == incident_type)
    if severity:
        q = q.filter(Incident.severity == severity)
    if status:
        q = q.filter(Incident.status == status)
    total = q.count()
    incidents = q.order_by(Incident.timestamp.desc()).offset(offset).limit(limit).all()
    return {"incidents": [inc_to_dict(i) for i in incidents], "total": total}


@router.get("/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    i = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not i:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc_to_dict(i)


@router.put("/{incident_id}")
def update_incident(incident_id: str, data: dict, db: Session = Depends(get_db)):
    i = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not i:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Incident not found")
    allowed = ["status", "notes", "assigned_to"]
    for key in allowed:
        if key in data:
            setattr(i, key, data[key])
    db.commit()
    return {"success": True, "incident": inc_to_dict(i)}
