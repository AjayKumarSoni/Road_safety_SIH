import sys
import datetime
import io

# Force UTF-8 output on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
import uuid
import random
from sqlalchemy.orm import Session
from models.models import Bus, BusDevice, Route, Event, Incident, Telemetry, TrafficData

# Raipur, CG coordinates
RAIPUR_CENTER = (21.2514, 81.6296)

ROUTES = [
    {
        "id": "RT-001",
        "name": "Route 12 — Station Road to Pandri Market",
        "waypoints": [
            {"lat": 21.2545, "lng": 81.6315, "name": "Raipur Railway Station"},
            {"lat": 21.2505, "lng": 81.6300, "name": "Fafadih Chowk"},
            {"lat": 21.2420, "lng": 81.6320, "name": "Jail Chowk"},
            {"lat": 21.2460, "lng": 81.6360, "name": "Ghadi Chowk"},
            {"lat": 21.2560, "lng": 81.6420, "name": "Devendra Nagar"},
            {"lat": 21.2640, "lng": 81.6480, "name": "Pandri Cloth Market"},
        ],
        "expected_time_min": 35,
        "actual_time_min": 42,
        "delay_min": 7,
        "congestion_level": "HIGH",
        "bus_count": 1,
        "avg_speed": 32.5,
        "distance_km": 8.4,
    },
    {
        "id": "RT-002",
        "name": "Route 7 — Ring Road No. 1 Expressway Arterial",
        "waypoints": [
            {"lat": 21.2280, "lng": 81.5950, "name": "Sarona Flyover"},
            {"lat": 21.2220, "lng": 81.6150, "name": "Tatibandh Interchange"},
            {"lat": 21.2180, "lng": 81.6320, "name": "Bhatagaon Bus Terminal"},
            {"lat": 21.2260, "lng": 81.6480, "name": "Pachpedi Naka Underpass"},
            {"lat": 21.2320, "lng": 81.6620, "name": "Santoshi Nagar Ring Road"},
        ],
        "expected_time_min": 28,
        "actual_time_min": 31,
        "delay_min": 3,
        "congestion_level": "MEDIUM",
        "bus_count": 1,
        "avg_speed": 52.0,
        "distance_km": 11.2,
    },
    {
        "id": "RT-003",
        "name": "Route 3 — VIP Road Airport Express Corridor",
        "waypoints": [
            {"lat": 21.2410, "lng": 81.6620, "name": "Telibandha Marine Drive Lake"},
            {"lat": 21.2320, "lng": 81.6780, "name": "Magneto Mall"},
            {"lat": 21.2240, "lng": 81.6920, "name": "Energy Park (Urja Park)"},
            {"lat": 21.2150, "lng": 81.7100, "name": "VIP Road Expressway"},
            {"lat": 21.1850, "lng": 81.7380, "name": "Swami Vivekananda Airport Raipur"},
        ],
        "expected_time_min": 25,
        "actual_time_min": 26,
        "delay_min": 1,
        "congestion_level": "LOW",
        "bus_count": 1,
        "avg_speed": 58.0,
        "distance_km": 14.5,
    },
    {
        "id": "RT-004",
        "name": "Route 15 — Dhamtari Road to Civil Lines",
        "waypoints": [
            {"lat": 21.1980, "lng": 81.6520, "name": "Dhamtari Naka Toll"},
            {"lat": 21.2120, "lng": 81.6440, "name": "Santoshi Nagar Chowk"},
            {"lat": 21.2280, "lng": 81.6380, "name": "Lalganga Shopping Mall"},
            {"lat": 21.2400, "lng": 81.6350, "name": "Civil Lines Administrative Hub"},
            {"lat": 21.2460, "lng": 81.6390, "name": "Raj Bhavan Road"},
        ],
        "expected_time_min": 28,
        "actual_time_min": 34,
        "delay_min": 6,
        "congestion_level": "MEDIUM",
        "bus_count": 1,
        "avg_speed": 34.0,
        "distance_km": 9.8,
    },
    {
        "id": "RT-005",
        "name": "Route 9 — Great Eastern (GE) Road Arterial",
        "waypoints": [
            {"lat": 21.2520, "lng": 81.5850, "name": "AIIMS Raipur"},
            {"lat": 21.2480, "lng": 81.6020, "name": "Amanaka Overbridge"},
            {"lat": 21.2450, "lng": 81.6220, "name": "Ashram Chowk"},
            {"lat": 21.2440, "lng": 81.6340, "name": "Jaistambh Chowk"},
            {"lat": 21.2420, "lng": 81.6550, "name": "Telibandha Junction"},
        ],
        "expected_time_min": 24,
        "actual_time_min": 29,
        "delay_min": 5,
        "congestion_level": "MEDIUM",
        "bus_count": 1,
        "avg_speed": 38.0,
        "distance_km": 10.4,
    },
]

BUSES = [
    {
        "id": "BUS-001",
        "name": "BUS-001",
        "route_id": "RT-001",
        "route_name": "Route 12",
        "status": "online",
        "driver_name": "Ramesh Kumar",
        "license_plate": "CG04-PA-1234",
        "sim_waypoint_index": 0,
        "lat": ROUTES[0]["waypoints"][0]["lat"],
        "lng": ROUTES[0]["waypoints"][0]["lng"],
        "speed": 36.0,
        "heading": 45.0,
    },
    {
        "id": "BUS-002",
        "name": "BUS-002",
        "route_id": "RT-002",
        "route_name": "Route 7",
        "status": "online",
        "driver_name": "Suresh Sahu",
        "license_plate": "CG04-PA-2345",
        "sim_waypoint_index": 1,
        "lat": ROUTES[1]["waypoints"][1]["lat"],
        "lng": ROUTES[1]["waypoints"][1]["lng"],
        "speed": 58.0,
        "heading": 110.0,
    },
    {
        "id": "BUS-003",
        "name": "BUS-003",
        "route_id": "RT-003",
        "route_name": "Route 3",
        "status": "online",
        "driver_name": "Mohan Patel",
        "license_plate": "CG04-PA-3456",
        "sim_waypoint_index": 0,
        "lat": ROUTES[2]["waypoints"][0]["lat"],
        "lng": ROUTES[2]["waypoints"][0]["lng"],
        "speed": 62.0,
        "heading": 135.0,
    },
    {
        "id": "BUS-004",
        "name": "BUS-004",
        "route_id": "RT-004",
        "route_name": "Route 15",
        "status": "online",
        "driver_name": "Dinesh Verma",
        "license_plate": "CG04-PA-4567",
        "sim_waypoint_index": 2,
        "lat": ROUTES[3]["waypoints"][2]["lat"],
        "lng": ROUTES[3]["waypoints"][2]["lng"],
        "speed": 32.0,
        "heading": 15.0,
    },
    {
        "id": "BUS-005",
        "name": "BUS-005",
        "route_id": "RT-005",
        "route_name": "Route 9",
        "status": "online",
        "driver_name": "Vijay Yadav",
        "license_plate": "CG04-PA-5678",
        "sim_waypoint_index": 1,
        "lat": ROUTES[4]["waypoints"][1]["lat"],
        "lng": ROUTES[4]["waypoints"][1]["lng"],
        "speed": 28.0,
        "heading": 85.0,
    },
]

ROAD_EVENTS = [
    {"type": "POTHOLE", "severity": "CRITICAL", "bus_id": "BUS-001", "lat": 21.2542, "lng": 81.6322, "loc": "Station Road Market", "desc": "Deep crater pothole (12 cm depth) in heavy traffic lane", "confidence": 0.94},
    {"type": "POTHOLE", "severity": "HIGH", "bus_id": "BUS-001", "lat": 21.2505, "lng": 81.6310, "loc": "Fafadih Chowk", "desc": "Asphalt depression and road crack cluster", "confidence": 0.88},
    {"type": "POTHOLE", "severity": "HIGH", "bus_id": "BUS-002", "lat": 21.2220, "lng": 81.6150, "loc": "Tatibandh Interchange", "desc": "Highway lane pothole on bridge approach", "confidence": 0.91},
    {"type": "POTHOLE", "severity": "MEDIUM", "bus_id": "BUS-002", "lat": 21.2185, "lng": 81.6325, "loc": "Bhatagaon Terminal Road", "desc": "Multiple surface fissures near bus entry gate", "confidence": 0.82},
    {"type": "WATERLOGGING", "severity": "CRITICAL", "bus_id": "BUS-003", "lat": 21.2260, "lng": 81.6480, "loc": "Pachpedi Naka Underpass", "desc": "Severe waterlogging (18 cm water depth), blocked stormwater grate", "confidence": 0.97},
    {"type": "WATERLOGGING", "severity": "HIGH", "bus_id": "BUS-003", "lat": 21.2410, "lng": 81.6620, "loc": "Telibandha Marine Drive", "desc": "Roadside rainwater pooling across bicycle lane", "confidence": 0.89},
    {"type": "DAMAGED_ROAD", "severity": "HIGH", "bus_id": "BUS-004", "lat": 21.2150, "lng": 81.7100, "loc": "VIP Road Expressway", "desc": "Cracked bitumen and shoulder erosion stretch", "confidence": 0.87},
    {"type": "MISSING_ROAD_DIVIDER", "severity": "HIGH", "bus_id": "BUS-004", "lat": 21.2240, "lng": 81.6920, "loc": "Energy Park Median", "desc": "Broken concrete road divider with 4-meter gap", "confidence": 0.92},
    {"type": "MISSING_ZEBRA_CROSSING", "severity": "HIGH", "bus_id": "BUS-005", "lat": 21.2400, "lng": 81.6350, "loc": "Civil Lines School Zone", "desc": "Faded pedestrian zebra crossing markings near school gate", "confidence": 0.93},
    {"type": "DAMAGED_TRAFFIC_SIGN", "severity": "MEDIUM", "bus_id": "BUS-005", "lat": 21.2460, "lng": 81.6390, "loc": "Raj Bhavan Road", "desc": "Speed limit sign tilted 45 degrees", "confidence": 0.84},
    {"type": "OPEN_MANHOLE", "severity": "CRITICAL", "bus_id": "BUS-001", "lat": 21.2420, "lng": 81.6320, "loc": "Jail Chowk Junction", "desc": "Open sewer manhole without safety barricade", "confidence": 0.96},
    {"type": "ROAD_DEBRIS", "severity": "MEDIUM", "bus_id": "BUS-002", "lat": 21.2280, "lng": 81.5950, "loc": "Sarona Flyover Approach", "desc": "Construction gravel and stone debris in middle lane", "confidence": 0.85},
    {"type": "POTHOLE", "severity": "HIGH", "bus_id": "BUS-005", "lat": 21.2480, "lng": 81.6020, "loc": "Amanaka Overbridge", "desc": "Expansion joint gap and pothole on flyover ramp", "confidence": 0.90},
    {"type": "MISSING_TRAFFIC_SIGN", "severity": "MEDIUM", "bus_id": "BUS-003", "lat": 21.2320, "lng": 81.6780, "loc": "Magneto Mall Junction", "desc": "Missing lane direction signboard", "confidence": 0.81},
    {"type": "POTHOLE", "severity": "CRITICAL", "bus_id": "BUS-004", "lat": 21.1980, "lng": 81.6520, "loc": "Dhamtari Naka Toll", "desc": "Heavy truck tire crater pothole (14 cm depth)", "confidence": 0.95},
]

INCIDENTS = [
    {
        "id": "INC-001",
        "bus_id": "BUS-002",
        "incident_type": "HIT_AND_RUN",
        "vehicle_type": "Car",
        "vehicle_id": "TRK-047",
        "registration": "CG04AB1234",
        "confidence": 0.94,
        "severity": "CRITICAL",
        "lat": 21.2502,
        "lng": 81.6305,
        "loc": "Station Road Junction",
        "status": "NEW",
        "notes": "Silver sedan hit two-wheeler and fled. Number plate extracted by AI.",
    },
    {
        "id": "INC-002",
        "bus_id": "BUS-001",
        "incident_type": "RASH_DRIVING",
        "vehicle_type": "Motorcycle",
        "vehicle_id": "MC-023",
        "registration": "CG04MX5678",
        "confidence": 0.87,
        "severity": "HIGH",
        "lat": 21.2410,
        "lng": 81.6315,
        "loc": "Jail Chowk",
        "status": "ACKNOWLEDGED",
        "notes": "Motorcycle weaving between lanes at high speed near school zone.",
    },
    {
        "id": "INC-003",
        "bus_id": "BUS-003",
        "incident_type": "PEDESTRIAN_RISK",
        "vehicle_type": "Truck",
        "vehicle_id": "TRK-012",
        "registration": "CG04TC9012",
        "confidence": 0.92,
        "severity": "HIGH",
        "lat": 21.2240,
        "lng": 81.6200,
        "loc": "Ring Road Crossing",
        "status": "ASSIGNED",
        "notes": "Pedestrians crossing at non-designated point. Truck approaching at 55 km/h.",
    },
    {
        "id": "INC-004",
        "bus_id": "BUS-004",
        "incident_type": "SUDDEN_BRAKING",
        "vehicle_type": "Car",
        "vehicle_id": "CAR-089",
        "registration": "CG04KD3456",
        "confidence": 0.78,
        "severity": "MEDIUM",
        "lat": 21.2650,
        "lng": 81.6380,
        "loc": "Avanti Vihar Road",
        "status": "RESOLVED",
        "notes": "Sudden braking event, minor rear-end. No injuries reported.",
    },
    {
        "id": "INC-005",
        "bus_id": "BUS-001",
        "incident_type": "DANGEROUS_MANOEUVRE",
        "vehicle_type": "Auto",
        "vehicle_id": "AUTO-055",
        "registration": "CG04AT7890",
        "confidence": 0.83,
        "severity": "MEDIUM",
        "lat": 21.2520,
        "lng": 81.6300,
        "loc": "Ghadi Chowk",
        "status": "ACKNOWLEDGED",
        "notes": "Auto-rickshaw performing U-turn on busy intersection.",
    },
]

TRAFFIC_SEGMENTS = [
    {"seg_id": "SEG-001", "name": "Station Road — Jail Chowk", "lat": 21.2380, "lng": 81.6325, "density": "HIGH", "count": 187, "speed": 14.0, "cars": 98, "bikes": 55, "buses": 12, "trucks": 18, "autos": 4, "bottleneck": True, "duration": 22},
    {"seg_id": "SEG-002", "name": "Ghadi Chowk Junction", "lat": 21.2514, "lng": 81.6296, "density": "CRITICAL", "count": 243, "speed": 8.0, "cars": 120, "bikes": 70, "buses": 8, "trucks": 22, "autos": 23, "bottleneck": True, "duration": 34},
    {"seg_id": "SEG-003", "name": "Pandri Road Stretch", "lat": 21.2600, "lng": 81.6340, "density": "MEDIUM", "count": 112, "speed": 28.0, "cars": 60, "bikes": 32, "buses": 5, "trucks": 8, "autos": 7, "bottleneck": False, "duration": 0},
    {"seg_id": "SEG-004", "name": "Ring Road — Tatibandh", "lat": 21.2220, "lng": 81.6190, "density": "LOW", "count": 67, "speed": 48.0, "cars": 35, "bikes": 22, "buses": 2, "trucks": 5, "autos": 3, "bottleneck": False, "duration": 0},
    {"seg_id": "SEG-005", "name": "Pachpedi Naka", "lat": 21.2300, "lng": 81.6250, "density": "HIGH", "count": 165, "speed": 17.0, "cars": 82, "bikes": 48, "buses": 9, "trucks": 14, "autos": 12, "bottleneck": True, "duration": 15},
    {"seg_id": "SEG-006", "name": "VIP Road — Avanti Vihar", "lat": 21.2635, "lng": 81.6340, "density": "MEDIUM", "count": 95, "speed": 35.0, "cars": 50, "bikes": 28, "buses": 4, "trucks": 7, "autos": 6, "bottleneck": False, "duration": 0},
    {"seg_id": "SEG-007", "name": "Dhamtari Road", "lat": 21.2150, "lng": 81.6405, "density": "CRITICAL", "count": 210, "speed": 9.5, "cars": 110, "bikes": 55, "buses": 10, "trucks": 25, "autos": 10, "bottleneck": True, "duration": 28},
    {"seg_id": "SEG-008", "name": "Civil Lines Area", "lat": 21.2420, "lng": 81.6315, "density": "LOW", "count": 45, "speed": 52.0, "cars": 25, "bikes": 12, "buses": 2, "trucks": 3, "autos": 3, "bottleneck": False, "duration": 0},
]


def seed_database(db: Session):
    """Seed the database with realistic Raipur data."""
    from models.models import Bus, BusDevice, Route, Event, Incident, Telemetry, TrafficData
    import datetime

    # Check if already seeded
    if db.query(Bus).count() > 0:
        print("Database already seeded, skipping...")
        return

    print("Seeding database...")

    # Routes
    for r in ROUTES:
        route = Route(
            id=r["id"],
            name=r["name"],
            waypoints=r["waypoints"],
            expected_time_min=r["expected_time_min"],
            actual_time_min=r["actual_time_min"],
            delay_min=r["delay_min"],
            congestion_level=r["congestion_level"],
            bus_count=r["bus_count"],
            avg_speed=r["avg_speed"],
            distance_km=r["distance_km"],
        )
        db.add(route)

    # Buses + Devices
    for b in BUSES:
        bus = Bus(**{k: v for k, v in b.items()})
        db.add(bus)
        device = BusDevice(
            bus_id=b["id"],
            camera_front=b["status"] != "offline",
            camera_rear=b["status"] != "offline",
            camera_left=b["status"] != "offline",
            camera_right=b["status"] != "offline",
            gps_status="LOCKED" if b["status"] != "offline" else "NO_SIGNAL",
            ai_status="RUNNING" if b["status"] == "online" else ("WARNING" if b["status"] == "warning" else "OFFLINE"),
            ai_fps=18.0 if b["status"] == "online" else 0.0,
            cpu_usage=random.uniform(50, 75),
            ram_usage=random.uniform(55, 72),
            temperature=random.uniform(48, 58),
            storage_usage=random.uniform(65, 80),
        )
        db.add(device)

    # Events
    now = datetime.datetime.utcnow()
    for i, e in enumerate(ROAD_EVENTS):
        hours_ago = random.randint(0, 24)
        minutes_ago = random.randint(0, 59)
        ts = now - datetime.timedelta(hours=hours_ago, minutes=minutes_ago)
        event = Event(
            event_id=f"EVT-{10001 + i}",
            bus_id=e["bus_id"],
            event_type=e["type"],
            confidence=e["confidence"],
            severity=e["severity"],
            lat=e["lat"],
            lng=e["lng"],
            timestamp=ts,
            source="SIMULATED_EDGE",
            description=e["desc"],
            location_name=e["loc"],
            status=random.choice(["NEW", "NEW", "VERIFIED", "ASSIGNED", "RESOLVED"]),
            metadata_json={"simulated": True},
        )
        db.add(event)

    # Incidents
    for inc in INCIDENTS:
        ts = now - datetime.timedelta(hours=random.randint(0, 12))
        incident = Incident(
            incident_id=inc["id"],
            bus_id=inc["bus_id"],
            incident_type=inc["incident_type"],
            vehicle_type=inc["vehicle_type"],
            vehicle_id=inc["vehicle_id"],
            registration=inc["registration"],
            confidence=inc["confidence"],
            severity=inc["severity"],
            lat=inc["lat"],
            lng=inc["lng"],
            timestamp=ts,
            status=inc["status"],
            notes=inc["notes"],
            location_name=inc["loc"],
        )
        db.add(incident)

    # Traffic Data
    for seg in TRAFFIC_SEGMENTS:
        td = TrafficData(
            segment_id=seg["seg_id"],
            segment_name=seg["name"],
            lat=seg["lat"],
            lng=seg["lng"],
            density_level=seg["density"],
            vehicle_count=seg["count"],
            avg_speed=seg["speed"],
            cars=seg["cars"],
            bikes=seg["bikes"],
            buses=seg["buses"],
            trucks=seg["trucks"],
            autos=seg["autos"],
            is_bottleneck=seg["bottleneck"],
            bottleneck_duration_min=seg["duration"],
        )
        db.add(td)

    db.commit()
    print("[OK] Database seeded successfully!")
