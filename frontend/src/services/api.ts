import axios from 'axios';
import type {
  Bus, Event, Incident, TrafficSegment, RouteData, EdgeNode,
  AnalyticsOverview, SimulationStatus, VideoJob
} from '../types';

const API = axios.create({ baseURL: '/api' });

// Fleet
export const getBuses = () => API.get<{ buses: Bus[]; total: number }>('/buses').then(r => r.data);
export const getBus = (id: string) => API.get<Bus>(`/buses/${id}`).then(r => r.data);
export const updateBus = (id: string, data: Partial<Bus>) => API.put(`/buses/${id}`, data);
export const getBusTelemetry = (id: string, limit = 50) => API.get(`/buses/${id}/telemetry`, { params: { limit } }).then(r => r.data);

// Events
export const getEvents = (params?: { bus_id?: string; event_type?: string; severity?: string; status?: string; limit?: number; offset?: number }) =>
  API.get<{ events: Event[]; total: number }>('/events', { params }).then(r => r.data);
export const getEvent = (id: string) => API.get<Event>(`/events/${id}`).then(r => r.data);
export const updateEvent = (id: string, data: Partial<Event>) => API.put(`/events/${id}`, data).then(r => r.data);
export const createEvent = (data: Partial<Event>) => API.post('/events', data).then(r => r.data);

// Incidents
export const getIncidents = (params?: { bus_id?: string; incident_type?: string; severity?: string; status?: string; limit?: number }) =>
  API.get<{ incidents: Incident[]; total: number }>('/incidents', { params }).then(r => r.data);
export const getIncident = (id: string) => API.get<Incident>(`/incidents/${id}`).then(r => r.data);
export const updateIncident = (id: string, data: { status?: string; notes?: string; assigned_to?: string }) =>
  API.put(`/incidents/${id}`, data).then(r => r.data);

// Traffic
export const getTraffic = () => API.get<{ segments: TrafficSegment[] }>('/traffic').then(r => r.data);
export const getTrafficDensity = () => API.get('/traffic/density').then(r => r.data);
export const getBottlenecks = () => API.get('/traffic/bottlenecks').then(r => r.data);
export const getHeatmap = () => API.get('/traffic/heatmap').then(r => r.data);

// Road issues
export const getRoadIssues = (params?: { event_type?: string; severity?: string; status?: string }) =>
  API.get('/roads/issues', { params }).then(r => r.data);

// Analytics
export const getAnalyticsOverview = () => API.get<AnalyticsOverview>('/analytics/overview').then(r => r.data);
export const getRouteAnalytics = () => API.get<{ routes: RouteData[] }>('/analytics/routes').then(r => r.data);
export const getInfraAnalytics = () => API.get('/analytics/infrastructure').then(r => r.data);
export const getCongestionAnalytics = () => API.get('/analytics/congestion').then(r => r.data);

// Edge nodes
export const getEdgeNodes = () => API.get<{ nodes: EdgeNode[]; total: number }>('/edge-nodes').then(r => r.data);
export const getEdgeNode = (id: string) => API.get(`/edge-nodes/${id}`).then(r => r.data);

// Video
export const uploadVideo = (file: File, busId: string) => {
  const form = new FormData();
  form.append('file', file);
  form.append('bus_id', busId);
  return API.post<{ job_id: string; status: string }>('/video/upload', form).then(r => r.data);
};
export const getVideoJobs = () => API.get<{ jobs: VideoJob[] }>('/video/jobs').then(r => r.data);
export const getVideoJob = (id: string) => API.get<VideoJob>(`/video/jobs/${id}`).then(r => r.data);

// Simulation
export const getSimStatus = () => API.get<SimulationStatus>('/simulation/status').then(r => r.data);
export const startSim = () => API.post('/simulation/start').then(r => r.data);
export const pauseSim = () => API.post('/simulation/pause').then(r => r.data);
export const resetSim = () => API.post('/simulation/reset').then(r => r.data);
export const setSimSpeed = (speed: number) => API.post('/simulation/speed', { speed }).then(r => r.data);
export const setScenario = (scenario: string) => API.post('/simulation/scenario', { scenario }).then(r => r.data);
export const startDemo = () => API.post('/simulation/demo').then(r => r.data);

// Dev generators
export const genPothole = () => API.post('/simulation/generate/pothole').then(r => r.data);
export const genTrafficJam = () => API.post('/simulation/generate/traffic_jam').then(r => r.data);
export const genWaterlogging = () => API.post('/simulation/generate/waterlogging').then(r => r.data);
export const genPedestrianRisk = () => API.post('/simulation/generate/pedestrian_risk').then(r => r.data);
export const genHitAndRun = () => API.post('/simulation/generate/hit_and_run').then(r => r.data);
export const genRashDriving = () => API.post('/simulation/generate/rash_driving').then(r => r.data);
export const genBusOffline = () => API.post('/simulation/generate/bus_offline').then(r => r.data);

// System health
export const getSystemHealth = () => API.get('/system/health').then(r => r.data);
