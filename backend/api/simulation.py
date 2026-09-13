from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from simulation.engine import (
    sim_state, start_simulation, pause_simulation, reset_simulation,
    run_demo_sequence, generate_road_event, generate_incident, SCENARIO_CONFIGS
)
from models.models import Bus, Event, Incident
import asyncio, random, datetime

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])


@router.get("/status")
def get_status():
    return {
        "running": sim_state.running,
        "speed_multiplier": sim_state.speed_multiplier,
        "tick": sim_state.tick,
        "scenario": sim_state.scenario,
        "demo_mode": sim_state.demo_mode,
        "available_scenarios": list(SCENARIO_CONFIGS.keys()),
    }


@router.post("/start")
def start(db: Session = Depends(get_db)):
    start_simulation()
    return {"success": True, "message": "Simulation started"}


@router.post("/pause")
def pause():
    pause_simulation()
    return {"success": True, "message": "Simulation paused"}


@router.post("/reset")
def reset():
    reset_simulation()
    return {"success": True, "message": "Simulation reset"}


@router.post("/speed")
def set_speed(data: dict):
    speed = data.get("speed", 1.0)
    if speed not in (1.0, 2.0, 5.0, 10.0):
        speed = 1.0
    sim_state.speed_multiplier = speed
    return {"success": True, "speed": speed}


@router.post("/scenario")
def set_scenario(data: dict):
    scenario = data.get("scenario", "normal")
    if scenario not in SCENARIO_CONFIGS:
        return {"success": False, "error": "Unknown scenario"}
    sim_state.scenario = scenario
    if not sim_state.running:
        start_simulation()
    return {"success": True, "scenario": scenario}


@router.post("/demo")
async def start_demo(background_tasks: BackgroundTasks):
    sim_state.demo_mode = True
    sim_state.scenario = "normal"
    start_simulation()
    background_tasks.add_task(run_demo_sequence)
    return {"success": True, "message": "Demo mode activated"}


# Developer event generators
@router.post("/generate/pothole")
def gen_pothole(db: Session = Depends(get_db)):
    buses = db.query(Bus).filter(Bus.status != "offline").all()
    bus = random.choice(buses) if buses else None
    if not bus:
        return {"success": False, "error": "No active buses"}
    evt = generate_road_event(bus.id, bus.lat, bus.lng, "POTHOLE")
    event = Event(
        event_id=evt["event_id"], bus_id=bus.id, event_type="POTHOLE",
        confidence=evt["confidence"], severity="HIGH",
        lat=evt["lat"], lng=evt["lng"],
        source="SIMULATED_EDGE", description=evt["description"],
        location_name=evt["location_name"], status="NEW",
        metadata_json={"simulated": True, "manual_trigger": True},
    )
    db.add(event)
    db.commit()
    return {"success": True, "event_id": evt["event_id"]}


@router.post("/generate/traffic_jam")
def gen_traffic_jam(db: Session = Depends(get_db)):
    from models.models import TrafficData
    segs = db.query(TrafficData).all()
    for seg in random.sample(segs, min(3, len(segs))):
        seg.density_level = "CRITICAL"
        seg.vehicle_count = random.randint(200, 260)
        seg.avg_speed = random.uniform(5, 12)
        seg.is_bottleneck = True
        seg.bottleneck_duration_min = random.randint(10, 40)
    db.commit()
    return {"success": True, "message": "Traffic jam generated"}


@router.post("/generate/waterlogging")
def gen_waterlogging(db: Session = Depends(get_db)):
    buses = db.query(Bus).filter(Bus.status != "offline").all()
    bus = random.choice(buses) if buses else None
    if not bus:
        return {"success": False}
    evt = generate_road_event(bus.id, bus.lat, bus.lng, "WATERLOGGING")
    event = Event(
        event_id=evt["event_id"], bus_id=bus.id, event_type="WATERLOGGING",
        confidence=evt["confidence"], severity="HIGH",
        lat=evt["lat"], lng=evt["lng"],
        source="SIMULATED_EDGE", description=evt["description"],
        location_name=evt["location_name"], status="NEW",
        metadata_json={"simulated": True, "manual_trigger": True},
    )
    db.add(event)
    db.commit()
    return {"success": True, "event_id": evt["event_id"]}


@router.post("/generate/pedestrian_risk")
def gen_pedestrian(db: Session = Depends(get_db)):
    buses = db.query(Bus).filter(Bus.status != "offline").all()
    bus = random.choice(buses) if buses else None
    if not bus:
        return {"success": False}
    inc = generate_incident(bus.id, bus.lat, bus.lng, "PEDESTRIAN_RISK")
    incident = Incident(
        incident_id=inc["incident_id"], bus_id=bus.id, incident_type="PEDESTRIAN_RISK",
        vehicle_type="Truck", registration=inc["registration"], confidence=inc["confidence"],
        severity="HIGH", lat=inc["lat"], lng=inc["lng"],
        notes=inc["notes"], location_name=inc["location_name"], status="NEW",
    )
    db.add(incident)
    db.commit()
    return {"success": True, "incident_id": inc["incident_id"]}


@router.post("/generate/hit_and_run")
def gen_hit_run(db: Session = Depends(get_db)):
    buses = db.query(Bus).filter(Bus.status != "offline").all()
    bus = random.choice(buses) if buses else None
    if not bus:
        return {"success": False}
    plates = ["CG04AB1234", "CG04MX5678", "CG04TC9012"]
    inc = generate_incident(bus.id, bus.lat, bus.lng, "HIT_AND_RUN")
    inc["registration"] = random.choice(plates)
    inc["severity"] = "CRITICAL"
    incident = Incident(
        incident_id=inc["incident_id"], bus_id=bus.id, incident_type="HIT_AND_RUN",
        vehicle_type="Car", registration=inc["registration"], confidence=0.94,
        severity="CRITICAL", lat=inc["lat"], lng=inc["lng"],
        notes=inc["notes"], location_name=inc["location_name"], status="NEW",
    )
    db.add(incident)
    db.commit()
    return {"success": True, "incident_id": inc["incident_id"], "registration": inc["registration"]}


@router.post("/generate/rash_driving")
def gen_rash_driving(db: Session = Depends(get_db)):
    buses = db.query(Bus).filter(Bus.status != "offline").all()
    bus = random.choice(buses) if buses else None
    if not bus:
        return {"success": False}
    inc = generate_incident(bus.id, bus.lat, bus.lng, "RASH_DRIVING")
    incident = Incident(
        incident_id=inc["incident_id"], bus_id=bus.id, incident_type="RASH_DRIVING",
        vehicle_type="Motorcycle", registration=inc["registration"], confidence=inc["confidence"],
        severity="HIGH", lat=inc["lat"], lng=inc["lng"],
        notes=inc["notes"], location_name=inc["location_name"], status="NEW",
    )
    db.add(incident)
    db.commit()
    return {"success": True, "incident_id": inc["incident_id"]}


@router.post("/generate/bus_offline")
def gen_bus_offline(db: Session = Depends(get_db)):
    buses = db.query(Bus).filter(Bus.status == "online").all()
    if not buses:
        return {"success": False, "error": "No online buses to take offline"}
    bus = random.choice(buses)
    bus.status = "offline"
    db.commit()
    return {"success": True, "bus_id": bus.id, "message": f"{bus.id} is now offline"}
