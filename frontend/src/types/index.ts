// Core data types for UrbanSense AI

export type BusStatus = 'online' | 'offline' | 'warning';
export type EventStatus = 'NEW' | 'VERIFIED' | 'ASSIGNED' | 'RESOLVED';
export type IncidentStatus = 'NEW' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'RESOLVED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DensityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface BusDevice {
  camera_front: boolean;
  camera_rear: boolean;
  camera_left: boolean;
  camera_right: boolean;
  gps_status: string;
  imu_status: string;
  network_type: string;
  network_signal: number;
  ai_status: string;
  ai_fps: number;
  cpu_usage: number;
  ram_usage: number;
  temperature: number;
  storage_usage: number;
  updated_at: string;
}

export interface Bus {
  id: string;
  name: string;
  route_id: string;
  route_name: string;
  status: BusStatus;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  last_seen: string;
  driver_name: string;
  license_plate: string;
  source: string;
  device?: BusDevice;
}

export interface Event {
  event_id: string;
  bus_id: string;
  event_type: string;
  confidence: number;
  severity: Severity;
  lat: number;
  lng: number;
  timestamp: string;
  source: string;
  evidence_url: string;
  status: EventStatus;
  description: string;
  location_name: string;
  metadata_json?: Record<string, unknown>;
}

export interface Incident {
  incident_id: string;
  bus_id: string;
  incident_type: string;
  vehicle_type: string;
  vehicle_id: string;
  registration: string;
  confidence: number;
  severity: Severity;
  lat: number;
  lng: number;
  timestamp: string;
  evidence_url: string;
  status: IncidentStatus;
  notes: string;
  location_name: string;
  assigned_to: string;
  source: string;
}

export interface TrafficSegment {
  segment_id: string;
  segment_name: string;
  lat: number;
  lng: number;
  density_level: DensityLevel;
  vehicle_count: number;
  avg_speed: number;
  cars: number;
  bikes: number;
  buses: number;
  trucks: number;
  autos: number;
  is_bottleneck: boolean;
  bottleneck_duration_min: number;
  timestamp: string;
}

export interface RouteData {
  id: string;
  name: string;
  bus_count: number;
  avg_speed: number;
  expected_time_min: number;
  actual_time_min: number;
  delay_min: number;
  congestion_level: DensityLevel;
  distance_km: number;
  waypoints: Array<{ lat: number; lng: number; name: string }>;
}

export interface EdgeNode {
  bus_id: string;
  bus_name: string;
  route_name: string;
  status: BusStatus;
  device_type: string;
  device_model: string;
  ai_engine: string;
  cpu_usage: number;
  ram_usage: number;
  temperature: number;
  storage_usage: number;
  ai_fps: number;
  ai_status: string;
  gps_status: string;
  imu_status: string;
  network_type: string;
  network_signal: number;
  cameras_online: number;
  cameras_total: number;
  camera_front: boolean;
  camera_rear: boolean;
  camera_left: boolean;
  camera_right: boolean;
  bandwidth_saved_pct: number;
  events_per_min: number;
  uptime_hours: number;
  last_seen: string;
}

export interface AnalyticsOverview {
  fleet: { total: number; online: number; offline: number; warning: number };
  road_intelligence: { total_defects: number; potholes: number; waterlogging: number; infrastructure_issues: number };
  traffic: { total_vehicles: number; high_congestion_zones: number; active_bottlenecks: number };
  safety: { active_incidents: number; pedestrian_risk_events: number; high_priority_alerts: number };
}

export interface SimulationStatus {
  running: boolean;
  speed_multiplier: number;
  tick: number;
  scenario: string;
  demo_mode: boolean;
  available_scenarios: string[];
}

export interface VideoJob {
  id: string;
  filename: string;
  bus_id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  total_frames: number;
  detections_count: number;
  events_generated: number;
  created_at: string;
  completed_at: string | null;
  detections?: Detection[];
}

export interface Detection {
  frame: number;
  timestamp_sec: number;
  class: string;
  confidence: number;
  track_id: number;
  bbox: [number, number, number, number];
  is_road_event?: boolean;
}

export interface WsMessage {
  type: 'bus_update' | 'new_event' | 'new_incident' | 'traffic_update' | 'demo_step' | 'demo_complete';
  data?: Record<string, unknown>;
  step?: number;
  message?: string;
  tick?: number;
}
