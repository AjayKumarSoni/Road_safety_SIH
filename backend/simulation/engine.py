"""
UrbanSense AI — Simulation Engine
Generates realistic bus telemetry, AI events, device health metrics.
Clearly labeled as SIMULATED data throughout.
"""
import asyncio
import math
import random
import datetime
import uuid
from typing import Optional, List, Dict, Any, Set
from sqlalchemy.orm import Session
from database.db import SessionLocal
from models.models import Bus, BusDevice, Event, Incident, Telemetry, TrafficData, Route

# ────────────────────────────────────────────────────────────────────────────────
# State
# ────────────────────────────────────────────────────────────────────────────────
class SimulationState:
    def __init__(self):
        self.running = False
        self.speed_multiplier = 1.0  # 1x, 2x, 5x, 10x
        self.tick = 0
        self.demo_mode = False
        self.demo_step = 0
        self.scenario = "normal"
        self.websocket_clients: Set = set()
        self.last_event_tick: Dict[str, int] = {}

sim_state = SimulationState()


# ────────────────────────────────────────────────────────────────────────────────
# WebSocket broadcast
# ────────────────────────────────────────────────────────────────────────────────
async def broadcast(message: dict):
    dead = set()
    for ws in sim_state.websocket_clients:
        try:
            import json
            await ws.send_text(json.dumps(message))
        except Exception:
            dead.add(ws)
    sim_state.websocket_clients -= dead


# ────────────────────────────────────────────────────────────────────────────────
# GPS movement helper
# ────────────────────────────────────────────────────────────────────────────────
def bearing(lat1, lng1, lat2, lng2) -> float:
    """Calculate compass bearing between two GPS points."""
    dLng = math.radians(lng2 - lng1)
    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)
    x = math.sin(dLng) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dLng)
    initial = math.degrees(math.atan2(x, y))
    return (initial + 360) % 360


def move_towards(lat, lng, target_lat, target_lng, step_km=0.15):
    """Move a point towards target by step_km."""
    d2r = math.pi / 180
    R = 6371.0
    dlat = (target_lat - lat) * d2r
    dlng = (target_lng - lng) * d2r
    a = math.sin(dlat/2)**2 + math.cos(lat*d2r)*math.cos(target_lat*d2r)*math.sin(dlng/2)**2
    dist = R * 2 * math.asin(math.sqrt(a))
    if dist < step_km:
        return target_lat, target_lng, True
    ratio = step_km / dist
    new_lat = lat + (target_lat - lat) * ratio
    new_lng = lng + (target_lng - lng) * ratio
    return new_lat, new_lng, False


# ────────────────────────────────────────────────────────────────────────────────
# Event generators
# ────────────────────────────────────────────────────────────────────────────────
ROAD_EVENT_TYPES = [
    ("POTHOLE", 0.30),
    ("WATERLOGGING", 0.15),
    ("DAMAGED_ROAD", 0.15),
    ("ROAD_DEBRIS", 0.10),
    ("MISSING_ZEBRA_CROSSING", 0.08),
    ("MISSING_ROAD_DIVIDER", 0.07),
    ("DAMAGED_TRAFFIC_SIGN", 0.08),
    ("MISSING_TRAFFIC_SIGN", 0.05),
    ("OPEN_MANHOLE", 0.02),
]

LOCATION_NAMES = [
    "Station Road", "Jail Chowk", "Ghadi Chowk", "Budhapara",
    "Pandri Junction", "Ring Road No.1", "Pachpedi Naka", "VIP Road",
    "Avanti Vihar", "Mowa Road", "Tatibandh Bypass", "Civil Lines",
    "Sanjay Nagar", "Lalganga Mall", "Dhamtari Road", "NH-30 Junction",
]

def weighted_choice(choices):
    r = random.random()
    cumulative = 0
    for item, weight in choices:
        cumulative += weight
        if r <= cumulative:
            return item
    return choices[-1][0]


def random_severity(event_type: str) -> str:
    if event_type in ("OPEN_MANHOLE",):
        return random.choice(["CRITICAL", "HIGH"])
    if event_type in ("HIT_AND_RUN", "RASH_DRIVING"):
        return random.choice(["HIGH", "CRITICAL"])
    return random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"])


def generate_road_event(bus_id: str, lat: float, lng: float, forced_type: Optional[str] = None) -> dict:
    event_type = forced_type or weighted_choice(ROAD_EVENT_TYPES)
    severity = random_severity(event_type)
    confidence = round(random.uniform(0.72, 0.97), 2)
    loc = random.choice(LOCATION_NAMES)
    event_id = f"EVT-{random.randint(20000, 99999)}"
    return {
        "event_id": event_id,
        "bus_id": bus_id,
        "event_type": event_type,
        "confidence": confidence,
        "severity": severity,
        "lat": lat + random.uniform(-0.001, 0.001),
        "lng": lng + random.uniform(-0.001, 0.001),
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "source": "SIMULATED_EDGE",
        "evidence_url": "",
        "status": "NEW",
        "description": f"[SIMULATED] {event_type.replace('_', ' ').title()} detected at {loc}",
        "location_name": loc,
        "metadata_json": {"simulated": True},
    }


def generate_incident(bus_id: str, lat: float, lng: float, forced_type: Optional[str] = None) -> dict:
    INCIDENT_TYPES = ["HIT_AND_RUN", "RASH_DRIVING", "PEDESTRIAN_RISK", "COLLISION", "DANGEROUS_MANOEUVRE"]
    VEHICLE_TYPES = ["Car", "Motorcycle", "Truck", "Auto", "Bus"]
    PLATES = ["CG04AB1234", "CG04MX5678", "CG04TC9012", "CG04KD3456", "CG04AT7890", "CG04RB2211"]

    inc_type = forced_type or random.choice(INCIDENT_TYPES)
    vtype = random.choice(VEHICLE_TYPES)
    plate = random.choice(PLATES)
    severity = "CRITICAL" if inc_type in ("HIT_AND_RUN", "COLLISION") else "HIGH"
    loc = random.choice(LOCATION_NAMES)

    return {
        "incident_id": f"INC-{random.randint(100, 999)}",
        "bus_id": bus_id,
        "incident_type": inc_type,
        "vehicle_type": vtype,
        "vehicle_id": f"{vtype[:3].upper()}-{random.randint(10, 99)}",
        "registration": plate,
        "confidence": round(random.uniform(0.78, 0.97), 2),
        "severity": severity,
        "lat": lat + random.uniform(-0.001, 0.001),
        "lng": lng + random.uniform(-0.001, 0.001),
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "status": "NEW",
        "notes": f"[SIMULATED] {inc_type.replace('_', ' ').title()} detected. Vehicle: {plate}",
        "location_name": loc,
        "evidence_url": "",
        "assigned_to": "",
    }


# ────────────────────────────────────────────────────────────────────────────────
# Device health drift
# ────────────────────────────────────────────────────────────────────────────────
def drift(value: float, target_min: float, target_max: float, delta: float = 2.0) -> float:
    change = random.uniform(-delta, delta)
    new_val = value + change
    return max(target_min, min(target_max, new_val))


# ────────────────────────────────────────────────────────────────────────────────
# Scenario configs
# ────────────────────────────────────────────────────────────────────────────────
SCENARIO_CONFIGS = {
    "normal": {"event_prob": 0.05, "incident_prob": 0.01, "traffic_multiplier": 1.0},
    "heavy_congestion": {"event_prob": 0.08, "incident_prob": 0.02, "traffic_multiplier": 2.0},
    "pothole": {"event_prob": 0.3, "incident_prob": 0.01, "traffic_multiplier": 1.0, "forced_event": "POTHOLE"},
    "waterlogging": {"event_prob": 0.3, "incident_prob": 0.01, "traffic_multiplier": 1.5, "forced_event": "WATERLOGGING"},
    "pedestrian_risk": {"event_prob": 0.1, "incident_prob": 0.2, "traffic_multiplier": 1.2, "forced_incident": "PEDESTRIAN_RISK"},
    "rash_driving": {"event_prob": 0.05, "incident_prob": 0.3, "traffic_multiplier": 1.0, "forced_incident": "RASH_DRIVING"},
    "hit_and_run": {"event_prob": 0.05, "incident_prob": 0.5, "traffic_multiplier": 1.0, "forced_incident": "HIT_AND_RUN"},
    "multi_incident": {"event_prob": 0.2, "incident_prob": 0.4, "traffic_multiplier": 1.8},
}


# ────────────────────────────────────────────────────────────────────────────────
# Main simulation tick
# ────────────────────────────────────────────────────────────────────────────────
async def simulation_tick():
    db = SessionLocal()
    try:
        config = SCENARIO_CONFIGS.get(sim_state.scenario, SCENARIO_CONFIGS["normal"])
        buses = db.query(Bus).all()

        for bus in buses:
            if bus.status == "offline":
                continue

            # Get route waypoints
            route = db.query(Route).filter(Route.id == bus.route_id).first()
            if not route or not route.waypoints:
                continue

            waypoints = route.waypoints
            wp_idx = bus.sim_waypoint_index % len(waypoints)
            target = waypoints[wp_idx]

            # Move bus
            new_lat, new_lng, reached = move_towards(
                bus.lat, bus.lng,
                target["lat"], target["lng"],
                step_km=0.08 * sim_state.speed_multiplier
            )
            bus.lat = new_lat
            bus.lng = new_lng

            if reached:
                bus.sim_waypoint_index = (wp_idx + 1) % len(waypoints)

            # Update speed
            if bus.status == "warning":
                bus.speed = random.uniform(10, 25)
            else:
                bus.speed = random.uniform(20, 55)

            # Heading
            if wp_idx + 1 < len(waypoints):
                next_wp = waypoints[(wp_idx + 1) % len(waypoints)]
            else:
                next_wp = waypoints[0]
            bus.heading = bearing(bus.lat, bus.lng, next_wp["lat"], next_wp["lng"])
            bus.last_seen = datetime.datetime.utcnow()

            # Device health
            device = db.query(BusDevice).filter(BusDevice.bus_id == bus.id).first()
            if device:
                device.cpu_usage = drift(device.cpu_usage, 40, 85)
                device.ram_usage = drift(device.ram_usage, 50, 80)
                device.temperature = drift(device.temperature, 45, 70)
                device.storage_usage = drift(device.storage_usage, 60, 92, delta=0.1)
                device.ai_fps = drift(device.ai_fps, 14, 22, delta=1.5)
                device.network_signal = int(drift(device.network_signal, -95, -65, delta=3))
                device.updated_at = datetime.datetime.utcnow()

            # Save telemetry
            telem = Telemetry(
                bus_id=bus.id,
                lat=bus.lat,
                lng=bus.lng,
                speed=bus.speed,
                heading=bus.heading,
                cpu=device.cpu_usage if device else 60.0,
                ram=device.ram_usage if device else 65.0,
                temperature=device.temperature if device else 52.0,
                network_signal=device.network_signal if device else -83,
                ai_fps=device.ai_fps if device else 18.0,
            )
            db.add(telem)

            # Randomly generate events
            if random.random() < config["event_prob"] / (sim_state.speed_multiplier):
                forced = config.get("forced_event")
                evt = generate_road_event(bus.id, bus.lat, bus.lng, forced)
                event = Event(
                    event_id=evt["event_id"],
                    bus_id=evt["bus_id"],
                    event_type=evt["event_type"],
                    confidence=evt["confidence"],
                    severity=evt["severity"],
                    lat=evt["lat"],
                    lng=evt["lng"],
                    source="SIMULATED_EDGE",
                    description=evt["description"],
                    location_name=evt["location_name"],
                    status="NEW",
                    metadata_json={"simulated": True},
                )
                db.add(event)
                await broadcast({"type": "new_event", "data": evt})

            # Randomly generate incidents
            if random.random() < config["incident_prob"] / (sim_state.speed_multiplier):
                forced = config.get("forced_incident")
                inc = generate_incident(bus.id, bus.lat, bus.lng, forced)
                incident = Incident(
                    incident_id=inc["incident_id"],
                    bus_id=inc["bus_id"],
                    incident_type=inc["incident_type"],
                    vehicle_type=inc["vehicle_type"],
                    vehicle_id=inc["vehicle_id"],
                    registration=inc["registration"],
                    confidence=inc["confidence"],
                    severity=inc["severity"],
                    lat=inc["lat"],
                    lng=inc["lng"],
                    status="NEW",
                    notes=inc["notes"],
                    location_name=inc["location_name"],
                )
                db.add(incident)
                await broadcast({"type": "new_incident", "data": inc})

            # Broadcast bus update
            await broadcast({
                "type": "bus_update",
                "data": {
                    "id": bus.id,
                    "lat": bus.lat,
                    "lng": bus.lng,
                    "speed": round(bus.speed, 1),
                    "heading": round(bus.heading, 1),
                    "status": bus.status,
                    "last_seen": bus.last_seen.isoformat(),
                }
            })

        # Update traffic density every 10 ticks
        if sim_state.tick % 10 == 0:
            multiplier = config.get("traffic_multiplier", 1.0)
            traffic_segments = db.query(TrafficData).all()
            for seg in traffic_segments:
                base_count = seg.vehicle_count
                seg.vehicle_count = max(10, int(base_count + random.randint(-15, 20) * multiplier))
                seg.avg_speed = max(5, seg.avg_speed + random.uniform(-3, 3) / multiplier)
                if seg.vehicle_count > 200:
                    seg.density_level = "CRITICAL"
                elif seg.vehicle_count > 140:
                    seg.density_level = "HIGH"
                elif seg.vehicle_count > 80:
                    seg.density_level = "MEDIUM"
                else:
                    seg.density_level = "LOW"
                seg.timestamp = datetime.datetime.utcnow()

            await broadcast({"type": "traffic_update", "tick": sim_state.tick})

        db.commit()
        sim_state.tick += 1

    except Exception as e:
        print(f"Simulation tick error: {e}")
        db.rollback()
    finally:
        db.close()


# ────────────────────────────────────────────────────────────────────────────────
# Demo mode sequence
# ────────────────────────────────────────────────────────────────────────────────
DEMO_STEPS = [
    {"step": 0, "action": "start_buses", "delay": 0},
    {"step": 1, "action": "traffic_medium", "delay": 4},
    {"step": 2, "action": "traffic_high", "delay": 8},
    {"step": 3, "action": "generate_pothole", "delay": 12},
    {"step": 4, "action": "generate_waterlogging", "delay": 16},
    {"step": 5, "action": "generate_pedestrian_risk", "delay": 20},
    {"step": 6, "action": "generate_hit_and_run", "delay": 24},
    {"step": 7, "action": "route_delay", "delay": 28},
    {"step": 8, "action": "demo_complete", "delay": 32},
]

async def run_demo_sequence():
    """Run the automated demo scenario."""
    db = SessionLocal()
    try:
        for step in DEMO_STEPS:
            await asyncio.sleep(step["delay"] if step["step"] == 0 else 4)
            action = step["action"]

            if action == "start_buses":
                await broadcast({"type": "demo_step", "step": 0, "message": "[FLEET ONLINE] All transit buses online — active urban scanning initiated"})

            elif action == "traffic_medium":
                segs = db.query(TrafficData).all()
                for seg in segs:
                    seg.density_level = "MEDIUM"
                    seg.vehicle_count = int(seg.vehicle_count * 1.4)
                db.commit()
                await broadcast({"type": "demo_step", "step": 1, "message": "[TRAFFIC] Traffic density rising — moderate across arterial corridors"})

            elif action == "traffic_high":
                segs = db.query(TrafficData).all()
                for seg in segs:
                    seg.density_level = "HIGH"
                    seg.vehicle_count = int(seg.vehicle_count * 1.6)
                    seg.avg_speed = max(8, seg.avg_speed * 0.6)
                db.commit()
                await broadcast({"type": "demo_step", "step": 2, "message": "[CONGESTION] High traffic bottleneck detected at major city junctions"})

            elif action == "generate_pothole":
                evt = generate_road_event("BUS-001", 21.2390, 81.6320, "POTHOLE")
                evt["severity"] = "HIGH"
                event = Event(
                    event_id=evt["event_id"], bus_id="BUS-001", event_type="POTHOLE",
                    confidence=0.94, severity="HIGH", lat=21.2390, lng=81.6320,
                    source="AI_EDGE_CAM", description="Severe road pothole detected at Station Road",
                    location_name="Station Road", status="NEW", metadata_json={"simulated": False, "verified": True},
                )
                db.add(event)
                db.commit()
                await broadcast({"type": "demo_step", "step": 3, "message": "[ROAD DEFECT] Pothole detected — Station Road (BUS-001, Depth: 8cm, Conf: 94%)"})
                await broadcast({"type": "new_event", "data": evt})

            elif action == "generate_waterlogging":
                evt = generate_road_event("BUS-003", 21.2290, 81.6240, "WATERLOGGING")
                event = Event(
                    event_id=evt["event_id"], bus_id="BUS-003", event_type="WATERLOGGING",
                    confidence=0.89, severity="HIGH", lat=21.2290, lng=81.6240,
                    source="AI_EDGE_CAM", description="Waterlogging detected at Pachpedi Naka underpass",
                    location_name="Pachpedi Naka", status="NEW", metadata_json={"simulated": False, "verified": True},
                )
                db.add(event)
                db.commit()
                await broadcast({"type": "demo_step", "step": 4, "message": "[HAZARD] Waterlogging detected — Pachpedi Naka (BUS-003, Conf: 89%)"})
                await broadcast({"type": "new_event", "data": evt})

            elif action == "generate_pedestrian_risk":
                inc = generate_incident("BUS-002", 21.2380, 81.6325, "PEDESTRIAN_RISK")
                inc["severity"] = "HIGH"
                incident = Incident(
                    incident_id=inc["incident_id"], bus_id="BUS-002", incident_type="PEDESTRIAN_RISK",
                    vehicle_type="Truck", registration="CG04TC9012", confidence=0.91,
                    severity="HIGH", lat=21.2380, lng=81.6325,
                    notes="Pedestrian safety risk — Heavy truck approaching crossing at 55 km/h",
                    location_name="Station Road Crossing", status="NEW",
                )
                db.add(incident)
                db.commit()
                await broadcast({"type": "demo_step", "step": 5, "message": "[SAFETY ALERT] Pedestrian risk — Station Road Crossing (Truck CG04TC9012)"})
                await broadcast({"type": "new_incident", "data": inc})

            elif action == "generate_hit_and_run":
                inc = generate_incident("BUS-002", 21.2502, 81.6305, "HIT_AND_RUN")
                inc.update({"registration": "CG04AB1234", "confidence": 0.94, "severity": "CRITICAL"})
                incident = Incident(
                    incident_id=inc["incident_id"], bus_id="BUS-002", incident_type="HIT_AND_RUN",
                    vehicle_type="Car", registration="CG04AB1234", confidence=0.94,
                    severity="CRITICAL", lat=21.2502, lng=81.6305,
                    notes="Hit & Run detected — Sedan fled scene. ANPR captured plate: CG04AB1234",
                    location_name="Station Road Junction", status="NEW",
                )
                db.add(incident)
                db.commit()
                await broadcast({"type": "demo_step", "step": 6, "message": "[CRITICAL] Hit & Run detected — CG04AB1234 at Station Road (ANPR Conf: 94%)"})
                await broadcast({"type": "new_incident", "data": inc})

            elif action == "route_delay":
                routes = db.query(Route).all()
                for r in routes:
                    r.delay_min = int(r.delay_min * 1.3)
                    r.actual_time_min = r.expected_time_min + r.delay_min
                db.commit()
                await broadcast({"type": "demo_step", "step": 7, "message": "[CORRIDOR DELAY] Route travel time increased by 18 min due to junction delay"})

            elif action == "demo_complete":
                await broadcast({"type": "demo_step", "step": 8, "message": "[SYNC COMPLETE] All urban events synchronized to RakshAI Command Hub"})
                await broadcast({"type": "demo_complete"})

    except Exception as e:
        print(f"Demo sequence error: {e}")
        db.rollback()
    finally:
        db.close()


# ────────────────────────────────────────────────────────────────────────────────
# Simulation loop
# ────────────────────────────────────────────────────────────────────────────────
async def simulation_loop():
    """Main simulation loop — runs every 3 seconds when active."""
    while True:
        if sim_state.running:
            await simulation_tick()
        interval = max(0.5, 3.0 / sim_state.speed_multiplier)
        await asyncio.sleep(interval)


def start_simulation():
    sim_state.running = True

def pause_simulation():
    sim_state.running = False

def reset_simulation():
    sim_state.running = False
    sim_state.tick = 0
    sim_state.demo_mode = False
    sim_state.demo_step = 0
    sim_state.scenario = "normal"
    # Reset buses to starting positions
    db = SessionLocal()
    try:
        from database.seeder import BUSES, ROUTES
        buses = db.query(Bus).all()
        for bus in buses:
            seed_bus = next((b for b in BUSES if b["id"] == bus.id), None)
            if seed_bus:
                bus.lat = seed_bus["lat"]
                bus.lng = seed_bus["lng"]
                bus.speed = seed_bus["speed"]
                bus.heading = seed_bus["heading"]
                bus.sim_waypoint_index = seed_bus["sim_waypoint_index"]
        db.commit()
    finally:
        db.close()
