import { create } from 'zustand';
import type { Bus, Event, Incident, TrafficSegment, AnalyticsOverview, WsMessage } from '../types';

interface AppState {
  // Data
  buses: Bus[];
  events: Event[];
  incidents: Incident[];
  trafficSegments: TrafficSegment[];
  overview: AnalyticsOverview | null;

  // Simulation
  simRunning: boolean;
  simSpeed: number;
  simScenario: string;
  demoMode: boolean;
  demoMessages: string[];

  // UI
  selectedBusId: string | null;
  selectedEventId: string | null;
  selectedIncidentId: string | null;
  alertCount: number;
  wsConnected: boolean;

  // Actions
  setBuses: (buses: Bus[]) => void;
  updateBusPosition: (id: string, lat: number, lng: number, speed: number, heading: number) => void;
  addEvent: (event: Event) => void;
  setEvents: (events: Event[]) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  addIncident: (incident: Incident) => void;
  setIncidents: (incidents: Incident[]) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  setTrafficSegments: (segments: TrafficSegment[]) => void;
  setOverview: (overview: AnalyticsOverview) => void;
  setSimRunning: (running: boolean) => void;
  setSimSpeed: (speed: number) => void;
  setSimScenario: (scenario: string) => void;
  setDemoMode: (mode: boolean) => void;
  addDemoMessage: (msg: string) => void;
  clearDemoMessages: () => void;
  setSelectedBus: (id: string | null) => void;
  setSelectedEvent: (id: string | null) => void;
  setSelectedIncident: (id: string | null) => void;
  incrementAlerts: () => void;
  setWsConnected: (connected: boolean) => void;
  handleWsMessage: (msg: WsMessage) => void;
}

const DEFAULT_BUSES: Bus[] = [
  { id: 'BUS-001', name: 'Raipur City Transit Bus 01', route_id: 'RT-001', route_name: 'Station Road - Telibandha Corridor', status: 'online', lat: 21.2514, lng: 81.6296, speed: 36, heading: 110, last_seen: new Date().toISOString(), driver_name: 'Rajesh Verma', license_plate: 'CG 04 TA 4421', source: 'GPS/NPU' },
  { id: 'BUS-002', name: 'Raipur Express Bus 02', route_id: 'RT-002', route_name: 'Ring Road 1 Expressway', status: 'online', lat: 21.2420, lng: 81.6500, speed: 58, heading: 175, last_seen: new Date().toISOString(), driver_name: 'Sunil Sahu', license_plate: 'CG 04 AB 1234', source: 'GPS/NPU' },
  { id: 'BUS-003', name: 'Raipur Metro Feeder 03', route_id: 'RT-003', route_name: 'VIP Road Airport Highway', status: 'online', lat: 21.2180, lng: 81.6850, speed: 18, heading: 45, last_seen: new Date().toISOString(), driver_name: 'Manoj Dewangan', license_plate: 'CG 04 M 9912', source: 'GPS/NPU' },
  { id: 'BUS-004', name: 'Raipur Southern Transit 04', route_id: 'RT-004', route_name: 'Dhamtari Road Corridor', status: 'online', lat: 21.2150, lng: 81.6480, speed: 62, heading: 195, last_seen: new Date().toISOString(), driver_name: 'Amit Patel', license_plate: 'CG 04 H 5502', source: 'GPS/NPU' },
  { id: 'BUS-005', name: 'Raipur Western Link 05', route_id: 'RT-005', route_name: 'GE Road AIIMS Transit Route', status: 'online', lat: 21.2410, lng: 81.6360, speed: 25, heading: 270, last_seen: new Date().toISOString(), driver_name: 'Vikram Singh', license_plate: 'CG 04 B 8890', source: 'GPS/NPU' },
];

const DEFAULT_EVENTS: Event[] = [
  { event_id: 'EVT-101', bus_id: 'BUS-001', event_type: 'POTHOLE', confidence: 0.94, severity: 'CRITICAL', lat: 21.2542, lng: 81.6322, timestamp: '12:01 PM', source: 'Front Road Cam', evidence_url: '', status: 'NEW', description: 'Deep road crater pothole (12cm depth) causing vehicle swerve', location_name: 'Station Road Market' },
  { event_id: 'EVT-102', bus_id: 'BUS-003', event_type: 'WATERLOGGING', confidence: 0.91, severity: 'CRITICAL', lat: 21.2280, lng: 81.6440, timestamp: '12:02 PM', source: 'Front Road Cam', evidence_url: '', status: 'NEW', description: 'Street submersion waterlogging (18cm depth) in low lying underpass', location_name: 'Pachpedi Naka Underpass' },
  { event_id: 'EVT-103', bus_id: 'BUS-004', event_type: 'MISSING_ROAD_DIVIDER', confidence: 0.89, severity: 'HIGH', lat: 21.2250, lng: 81.6780, timestamp: '11:20 AM', source: 'Front Road Cam', evidence_url: '', status: 'NEW', description: 'Broken concrete median divider with 4m hazard gap', location_name: 'VIP Road Airport Highway' },
  { event_id: 'EVT-104', bus_id: 'BUS-005', event_type: 'MISSING_ZEBRA_CROSSING', confidence: 0.88, severity: 'HIGH', lat: 21.2410, lng: 81.6360, timestamp: '12:01 PM', source: 'Front Road Cam', evidence_url: '', status: 'NEW', description: 'Severely faded school zebra crossing in high footfall zone', location_name: 'Civil Lines School Zone' },
  { event_id: 'EVT-105', bus_id: 'BUS-002', event_type: 'ROAD_DEBRIS', confidence: 0.87, severity: 'MEDIUM', lat: 21.2480, lng: 81.5950, timestamp: '10:40 AM', source: 'Front Road Cam', evidence_url: '', status: 'NEW', description: 'Fallen construction aggregate debris in middle lane', location_name: 'Ring Road 1 Expressway' },
  { event_id: 'EVT-106', bus_id: 'BUS-001', event_type: 'DAMAGED_ROAD', confidence: 0.92, severity: 'MEDIUM', lat: 21.2531, lng: 81.6310, timestamp: '11:48 AM', source: 'Front Road Cam', evidence_url: '', status: 'NEW', description: 'Extensive alligator asphalt surface fatigue cracking', location_name: 'Station Road (Near Gurudwara)' },
  { event_id: 'EVT-107', bus_id: 'BUS-004', event_type: 'DAMAGED_TRAFFIC_SIGN', confidence: 0.86, severity: 'MEDIUM', lat: 21.2180, lng: 81.6850, timestamp: '12:00 PM', source: 'Front Road Cam', evidence_url: '', status: 'NEW', description: 'Speed limit signboard tilted at 45 degree angle', location_name: 'Energy Park Junction' },
  { event_id: 'EVT-108', bus_id: 'BUS-001', event_type: 'OPEN_MANHOLE', confidence: 0.95, severity: 'CRITICAL', lat: 21.2410, lng: 81.6620, timestamp: '10:55 AM', source: 'Front Road Cam', evidence_url: '', status: 'NEW', description: 'Sunken stormwater manhole chamber on transit lane', location_name: 'Telibandha Main Road' }
];

const DEFAULT_INCIDENTS: Incident[] = [
  { incident_id: 'INC-201', bus_id: 'BUS-002', incident_type: 'RASH_DRIVING', vehicle_type: 'Sedan', vehicle_id: 'VEH-901', registration: 'CG 04 AB 1234', confidence: 0.95, severity: 'CRITICAL', lat: 21.2420, lng: 81.6500, timestamp: '12:03 PM', evidence_url: '', status: 'NEW', notes: 'Vehicle detected traveling at 84 km/h in designated 50 km/h municipal zone with rapid zigzag maneuvers', location_name: 'Ring Road No. 1 Expressway', assigned_to: 'Traffic Police HQ', source: 'ANPR High-Speed Unit' },
  { incident_id: 'INC-202', bus_id: 'BUS-005', incident_type: 'PEDESTRIAN_RISK', vehicle_type: 'Van', vehicle_id: 'VEH-902', registration: 'CG 04 B 8890', confidence: 0.89, severity: 'HIGH', lat: 21.2410, lng: 81.6360, timestamp: '11:55 AM', evidence_url: '', status: 'NEW', notes: 'Transit vehicle failed to yield to students at faded pedestrian crosswalk', location_name: 'Civil Lines School Zone', assigned_to: 'Traffic Safety Cell', source: 'Front Telemetry NPU' }
];

const DEFAULT_OVERVIEW: AnalyticsOverview = {
  fleet: { total: 5, online: 5, offline: 0, warning: 0 },
  road_intelligence: { total_defects: 48, potholes: 22, waterlogging: 9, infrastructure_issues: 17 },
  traffic: { total_vehicles: 1420, high_congestion_zones: 3, active_bottlenecks: 2 },
  safety: { active_incidents: 4, pedestrian_risk_events: 3, high_priority_alerts: 2 }
};

export const useStore = create<AppState>((set, get) => ({
  buses: DEFAULT_BUSES,
  events: DEFAULT_EVENTS,
  incidents: DEFAULT_INCIDENTS,
  trafficSegments: [],
  overview: DEFAULT_OVERVIEW,
  simRunning: false,
  simSpeed: 1,
  simScenario: 'normal',
  demoMode: false,
  demoMessages: [],
  selectedBusId: null,
  selectedEventId: null,
  selectedIncidentId: null,
  alertCount: 0,
  wsConnected: false,

  setBuses: (buses) => set({ buses }),
  updateBusPosition: (id, lat, lng, speed, heading) =>
    set((state) => ({
      buses: state.buses.map((b) =>
        b.id === id ? { ...b, lat, lng, speed, heading, last_seen: new Date().toISOString() } : b
      ),
    })),
  addEvent: (event) =>
    set((state) => {
      const filtered = state.events.filter((e) => e.event_id !== event.event_id);
      return {
        events: [event, ...filtered].slice(0, 200),
        alertCount: (event.severity === 'HIGH' || event.severity === 'CRITICAL')
          ? Math.min(7, state.alertCount + 1)
          : state.alertCount,
      };
    }),
  setEvents: (events) => {
    const seen = new Set<string>();
    const unique = events.filter((e) => {
      if (!e.event_id || seen.has(e.event_id)) return false;
      seen.add(e.event_id);
      return true;
    });
    set({ events: unique });
  },
  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map((e) => (e.event_id === id ? { ...e, ...updates } : e)),
    })),
  addIncident: (incident) =>
    set((state) => {
      const filtered = state.incidents.filter((i) => i.incident_id !== incident.incident_id);
      return {
        incidents: [incident, ...filtered].slice(0, 100),
        alertCount: Math.min(8, state.alertCount + 1),
      };
    }),
  setIncidents: (incidents) => {
    const seen = new Set<string>();
    const unique = incidents.filter((i) => {
      if (!i.incident_id || seen.has(i.incident_id)) return false;
      seen.add(i.incident_id);
      return true;
    });
    set({
      incidents: unique,
      alertCount: unique.filter((i) => i.status === 'NEW' && (i.severity === 'CRITICAL' || i.severity === 'HIGH')).length || 2,
    });
  },
  updateIncident: (id, updates) =>
    set((state) => ({
      incidents: state.incidents.map((i) => (i.incident_id === id ? { ...i, ...updates } : i)),
    })),
  setTrafficSegments: (segments) => set({ trafficSegments: segments }),
  setOverview: (overview) => set({ overview }),
  setSimRunning: (simRunning) => set({ simRunning }),
  setSimSpeed: (simSpeed) => set({ simSpeed }),
  setSimScenario: (simScenario) => set({ simScenario }),
  setDemoMode: (demoMode) => set({ demoMode }),
  addDemoMessage: (msg) =>
    set((state) => ({ demoMessages: [...state.demoMessages.slice(-9), msg] })),
  clearDemoMessages: () => set({ demoMessages: [] }),
  setSelectedBus: (selectedBusId) => set({ selectedBusId }),
  setSelectedEvent: (selectedEventId) => set({ selectedEventId }),
  setSelectedIncident: (selectedIncidentId) => set({ selectedIncidentId }),
  incrementAlerts: () => set((state) => ({ alertCount: state.alertCount + 1 })),
  setWsConnected: (wsConnected) => set({ wsConnected }),

  handleWsMessage: (msg: WsMessage) => {
    const { updateBusPosition, addEvent, addIncident, addDemoMessage, setDemoMode } = get();
    if (msg.type === 'bus_update' && msg.data) {
      const d = msg.data as { id: string; lat: number; lng: number; speed: number; heading: number };
      updateBusPosition(d.id, d.lat, d.lng, d.speed, d.heading);
    } else if (msg.type === 'new_event' && msg.data) {
      addEvent(msg.data as unknown as Event);
    } else if (msg.type === 'new_incident' && msg.data) {
      addIncident(msg.data as unknown as Incident);
    } else if (msg.type === 'demo_step' && msg.message) {
      addDemoMessage(msg.message);
    } else if (msg.type === 'demo_complete') {
      addDemoMessage('[COMPLETE] Demo scenario finished');
      setDemoMode(false);
    }
  },
}));
