from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, JSON, Text
from sqlalchemy.sql import func
from database.db import Base
import datetime


class Bus(Base):
    __tablename__ = "buses"
    id = Column(String, primary_key=True)  # BUS-001
    name = Column(String)
    route_id = Column(String)
    route_name = Column(String)
    status = Column(String, default="online")  # online, offline, warning
    lat = Column(Float, default=21.2514)
    lng = Column(Float, default=81.6296)
    speed = Column(Float, default=0)
    heading = Column(Float, default=0)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    driver_name = Column(String)
    license_plate = Column(String)
    sim_waypoint_index = Column(Integer, default=0)


class BusDevice(Base):
    __tablename__ = "bus_devices"
    id = Column(Integer, primary_key=True, autoincrement=True)
    bus_id = Column(String)
    camera_front = Column(Boolean, default=True)
    camera_rear = Column(Boolean, default=True)
    camera_left = Column(Boolean, default=True)
    camera_right = Column(Boolean, default=True)
    gps_status = Column(String, default="LOCKED")
    imu_status = Column(String, default="ACTIVE")
    network_type = Column(String, default="4G")
    network_signal = Column(Integer, default=-83)
    ai_status = Column(String, default="RUNNING")
    ai_fps = Column(Float, default=18.0)
    cpu_usage = Column(Float, default=60.0)
    ram_usage = Column(Float, default=65.0)
    temperature = Column(Float, default=52.0)
    storage_usage = Column(Float, default=70.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


class Route(Base):
    __tablename__ = "routes"
    id = Column(String, primary_key=True)
    name = Column(String)
    waypoints = Column(JSON)  # list of {lat, lng, name}
    expected_time_min = Column(Integer)
    actual_time_min = Column(Integer, default=0)
    delay_min = Column(Integer, default=0)
    congestion_level = Column(String, default="LOW")
    bus_count = Column(Integer, default=1)
    avg_speed = Column(Float, default=35.0)
    distance_km = Column(Float, default=12.0)


class Event(Base):
    __tablename__ = "events"
    event_id = Column(String, primary_key=True)
    bus_id = Column(String)
    event_type = Column(String)  # POTHOLE, WATERLOGGING, TRAFFIC_CONGESTION, etc.
    confidence = Column(Float, default=0.9)
    severity = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    lat = Column(Float)
    lng = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    source = Column(String, default="SIMULATED_EDGE")
    evidence_url = Column(String, default="")
    status = Column(String, default="NEW")  # NEW, VERIFIED, ASSIGNED, RESOLVED
    description = Column(Text, default="")
    location_name = Column(String, default="")
    metadata_json = Column(JSON, default={})


class Incident(Base):
    __tablename__ = "incidents"
    incident_id = Column(String, primary_key=True)
    bus_id = Column(String)
    incident_type = Column(String)  # HIT_AND_RUN, RASH_DRIVING, COLLISION, PEDESTRIAN_RISK
    vehicle_type = Column(String, default="")
    vehicle_id = Column(String, default="")
    registration = Column(String, default="")
    confidence = Column(Float, default=0.9)
    severity = Column(String, default="HIGH")
    lat = Column(Float)
    lng = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    evidence_url = Column(String, default="")
    status = Column(String, default="NEW")  # NEW, ACKNOWLEDGED, ASSIGNED, RESOLVED
    notes = Column(Text, default="")
    location_name = Column(String, default="")
    assigned_to = Column(String, default="")


class Telemetry(Base):
    __tablename__ = "telemetry"
    id = Column(Integer, primary_key=True, autoincrement=True)
    bus_id = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    lat = Column(Float)
    lng = Column(Float)
    speed = Column(Float)
    heading = Column(Float)
    cpu = Column(Float)
    ram = Column(Float)
    temperature = Column(Float)
    network_signal = Column(Integer)
    ai_fps = Column(Float)


class TrafficData(Base):
    __tablename__ = "traffic_data"
    id = Column(Integer, primary_key=True, autoincrement=True)
    segment_id = Column(String)
    segment_name = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    density_level = Column(String, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    vehicle_count = Column(Integer, default=0)
    avg_speed = Column(Float, default=40.0)
    cars = Column(Integer, default=0)
    bikes = Column(Integer, default=0)
    buses = Column(Integer, default=0)
    trucks = Column(Integer, default=0)
    autos = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_bottleneck = Column(Boolean, default=False)
    bottleneck_duration_min = Column(Integer, default=0)


class VideoJob(Base):
    __tablename__ = "video_jobs"
    id = Column(String, primary_key=True)
    filename = Column(String)
    file_path = Column(String)
    bus_id = Column(String, default="BUS-001")
    status = Column(String, default="QUEUED")  # QUEUED, PROCESSING, COMPLETED, FAILED
    progress = Column(Integer, default=0)
    total_frames = Column(Integer, default=0)
    detections_count = Column(Integer, default=0)
    events_generated = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    detections = Column(JSON, default=[])
