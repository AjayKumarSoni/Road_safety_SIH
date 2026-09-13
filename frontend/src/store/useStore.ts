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

export const useStore = create<AppState>((set, get) => ({
  buses: [],
  events: [],
  incidents: [],
  trafficSegments: [],
  overview: null,
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
