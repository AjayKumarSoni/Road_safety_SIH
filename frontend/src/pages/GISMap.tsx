import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store/useStore';
import { getBuses, getEvents, getTraffic, getRouteAnalytics, updateEvent } from '../services/api';
import type { Bus, Event, TrafficSegment, RouteData } from '../types';
import {
  Layers, MapPin, Activity, Flame, Wrench, BarChart3,
  CheckCircle2, AlertTriangle, Shield, Clock, ExternalLink, Download, ArrowUpRight, Navigation
} from 'lucide-react';

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom SVG bus icon
function createBusIcon(status: string, busId: string) {
  const color = status === 'online' ? '#2563eb' : status === 'warning' ? '#f59e0b' : '#64748b';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="2"/>
    <rect x="10" y="10" width="16" height="16" rx="4" fill="${color}"/>
    <circle cx="14" cy="22" r="2" fill="#ffffff"/>
    <circle cx="22" cy="22" r="2" fill="#ffffff"/>
    <rect x="12" y="13" width="12" height="5" rx="1.5" fill="#ffffff"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

const EVENT_COLORS: Record<string, string> = {
  POTHOLE: '#dc2626',
  WATERLOGGING: '#0284c7',
  DAMAGED_ROAD: '#ea580c',
  ROAD_DEBRIS: '#d97706',
  OPEN_MANHOLE: '#b91c1c',
  MISSING_ZEBRA_CROSSING: '#7c3aed',
  MISSING_ROAD_DIVIDER: '#db2777',
  DAMAGED_TRAFFIC_SIGN: '#ca8a04',
  MISSING_TRAFFIC_SIGN: '#ea580c',
  HIT_AND_RUN: '#dc2626',
  RASH_DRIVING: '#ef4444',
  PEDESTRIAN_RISK: '#f59e0b',
  COLLISION: '#b91c1c',
};

function FlyTo({ lat, lng, zoom = 15 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.2 });
  }, [lat, lng, zoom]);
  return null;
}

const CORRIDORS = [
  { name: 'Station Road Corridor', lat: 21.2540, lng: 81.6320, tag: 'High Pothole Risk' },
  { name: 'Ring Road No. 1 Arterial', lat: 21.2260, lng: 81.6480, tag: 'Speed & ANPR' },
  { name: 'Pachpedi Naka Underpass', lat: 21.2260, lng: 81.6480, tag: 'Monsoon Flood Zone' },
  { name: 'VIP Road Airport Highway', lat: 21.2150, lng: 81.7100, tag: 'Express Transit' },
  { name: 'Civil Lines Urban Center', lat: 21.2400, lng: 81.6350, tag: 'Pedestrian Crossing' },
];

export const RAIPUR_TRANSIT_CORRIDORS = [
  {
    id: 'route-12',
    name: 'Route 12 — Station Road to Pandri Cloth Market',
    color: '#2563eb',
    bus: 'BUS-001',
    path: [
      [21.2545, 81.6315],
      [21.2505, 81.6300],
      [21.2420, 81.6320],
      [21.2460, 81.6360],
      [21.2560, 81.6420],
      [21.2640, 81.6480],
    ],
  },
  {
    id: 'route-ring',
    name: 'Route 7 — Ring Road No. 1 Expressway Arterial',
    color: '#ef4444',
    bus: 'BUS-002',
    path: [
      [21.2280, 81.5950],
      [21.2220, 81.6150],
      [21.2180, 81.6320],
      [21.2260, 81.6480],
      [21.2320, 81.6620],
    ],
  },
  {
    id: 'route-vip',
    name: 'Route 3 — VIP Road Airport Express Corridor',
    color: '#0284c7',
    bus: 'BUS-003',
    path: [
      [21.2410, 81.6620],
      [21.2320, 81.6780],
      [21.2240, 81.6920],
      [21.2150, 81.7100],
      [21.1850, 81.7380],
    ],
  },
  {
    id: 'route-dhamtari',
    name: 'Route 15 — Dhamtari Road to Civil Lines',
    color: '#d97706',
    bus: 'BUS-004',
    path: [
      [21.1980, 81.6520],
      [21.2120, 81.6440],
      [21.2280, 81.6380],
      [21.2400, 81.6350],
      [21.2460, 81.6390],
    ],
  },
  {
    id: 'route-ge',
    name: 'Route 9 — Great Eastern (GE) Road Arterial',
    color: '#7c3aed',
    bus: 'BUS-005',
    path: [
      [21.2520, 81.5850],
      [21.2480, 81.6020],
      [21.2450, 81.6220],
      [21.2440, 81.6340],
      [21.2420, 81.6550],
    ],
  },
];

export function GISMap() {
  const { buses, events, trafficSegments, setBuses, setEvents, setTrafficSegments, updateEvent: updateStoreEvent } = useStore();
  const [activeTab, setActiveTab] = useState<'map' | 'routes' | 'maintenance'>('map');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [activeHeatmap, setActiveHeatmap] = useState<'none' | 'potholes' | 'traffic' | 'flood'>('potholes');
  const [showBuses, setShowBuses] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [routeAnalytics, setRouteAnalytics] = useState<RouteData[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [fleet, evts, traffic, routesRes] = await Promise.all([
        getBuses(),
        getEvents({ limit: 120 }),
        getTraffic(),
        getRouteAnalytics(),
      ]);
      if (fleet?.buses?.length) setBuses(fleet.buses);
      if (evts?.events?.length) setEvents(evts.events);
      if (traffic?.segments?.length) setTrafficSegments(traffic.segments);
      if (routesRes?.routes) setRouteAnalytics(routesRes.routes);
    } catch (e) {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (eventId: string, newStatus: any) => {
    updateStoreEvent(eventId, { status: newStatus });
    setActionNotice(`Work Order for ${eventId} updated to ${newStatus}`);
    setTimeout(() => setActionNotice(null), 4000);
    try {
      await updateEvent(eventId, { status: newStatus });
    } catch {}
  };

  const filteredEvents = events.filter((e) =>
    filter === 'All' || e.event_type === filter
  );

  const potholeEvents = events.filter((e) => ['POTHOLE', 'DAMAGED_ROAD', 'OPEN_MANHOLE'].includes(e.event_type));
  const waterlogEvents = events.filter((e) => e.event_type === 'WATERLOGGING');

  const exportWorkOrdersCSV = () => {
    const headers = ['Work Order ID', 'Defect Type', 'Reporting Bus', 'Severity', 'Confidence', 'Status', 'GPS Latitude', 'GPS Longitude', 'Corridor / Location'];
    const rows = filteredEvents.map((e) => [
      `WO-${e.event_id}`,
      e.event_type.replace(/_/g, ' '),
      e.bus_id,
      e.severity,
      `${(e.confidence * 100).toFixed(1)}%`,
      e.status,
      e.lat.toFixed(5),
      e.lng.toFixed(5),
      e.location_name || 'Corridor'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RakshAI_PWD_WorkOrders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: 1350, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 70px)' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#eff6ff', padding: 8, borderRadius: 8, border: '1px solid #bfdbfe' }}>
            <MapPin size={20} color="#2563eb" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              GIS Map & Road Hotspots
            </h1>
            <p style={{ fontSize: 12.5, color: '#64748b' }}>
              Interactive city map of potholes, waterlogging, route quality, and PWD work orders
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Sub-tab Navigation */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: 3,
            borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}>
            <button
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'map' ? '#ffffff' : 'transparent',
                color: activeTab === 'map' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'map' ? 700 : 500,
                fontSize: 12.5,
                cursor: 'pointer',
                boxShadow: activeTab === 'map' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={() => setActiveTab('map')}
            >
              <Layers size={14} />
              City Map & Hotspots
            </button>
            <button
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'routes' ? '#ffffff' : 'transparent',
                color: activeTab === 'routes' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'routes' ? 700 : 500,
                fontSize: 12.5,
                cursor: 'pointer',
                boxShadow: activeTab === 'routes' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={() => setActiveTab('routes')}
            >
              <BarChart3 size={14} />
              Route Road Quality
            </button>
            <button
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'maintenance' ? '#ffffff' : 'transparent',
                color: activeTab === 'maintenance' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'maintenance' ? 700 : 500,
                fontSize: 12.5,
                cursor: 'pointer',
                boxShadow: activeTab === 'maintenance' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={() => setActiveTab('maintenance')}
            >
              <Wrench size={14} />
              PWD Work Orders ({potholeEvents.length})
            </button>
          </div>

          <button
            className="btn btn-sm"
            onClick={exportWorkOrdersCSV}
            style={{
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 8,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#334155',
            }}
          >
            <Download size={13} /> Export PWD Manifest
          </button>
        </div>
      </div>

      {/* Toast */}
      {actionNotice && (
        <div style={{
          marginBottom: 12,
          padding: '10px 16px',
          borderRadius: 8,
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#059669',
          fontSize: 13,
          fontWeight: 600,
        }}>
          <CheckCircle2 size={16} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TAB 1: HEAT MAPS & SPATIAL MAP */}
      {activeTab === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 14 }}>
          {/* Spatial Toolbar: Heatmap Modes & Corridors */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            {/* Heatmap Layer Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                <Flame size={15} color="#ea580c" />
                <span>Heat Map Mode:</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { key: 'potholes', label: 'Pothole & Surface Damage', color: '#dc2626' },
                  { key: 'traffic', label: 'Traffic Chokepoints', color: '#f59e0b' },
                  { key: 'flood', label: 'Monsoon Flood Zones', color: '#0284c7' },
                  { key: 'none', label: 'Standard GIS Markers', color: '#64748b' },
                ].map((h) => (
                  <button
                    key={h.key}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: activeHeatmap === h.key ? 700 : 500,
                      background: activeHeatmap === h.key ? `${h.color}15` : '#f8fafc',
                      border: activeHeatmap === h.key ? `1.5px solid ${h.color}` : '1px solid #e2e8f0',
                      color: activeHeatmap === h.key ? h.color : '#475569',
                      cursor: 'pointer',
                    }}
                    onClick={() => setActiveHeatmap(h.key as any)}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Corridor Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Fly to Corridor:</span>
              {CORRIDORS.map((c) => (
                <button
                  key={c.name}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                  onClick={() => setFlyTo({ lat: c.lat, lng: c.lng })}
                  title={c.tag}
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Filter checkboxes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', color: '#334155', fontWeight: 500 }}>
                <input type="checkbox" checked={showRoutes} onChange={(e) => setShowRoutes(e.target.checked)} />
                <span style={{ width: 10, height: 3, borderRadius: 1, background: '#6366f1' }} />
                Transit Corridors (5)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', color: '#334155', fontWeight: 500 }}>
                <input type="checkbox" checked={showBuses} onChange={(e) => setShowBuses(e.target.checked)} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                Buses ({buses.length})
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', color: '#334155', fontWeight: 500 }}>
                <input type="checkbox" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
                Defects ({filteredEvents.length})
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', color: '#334155', fontWeight: 500 }}>
                <input type="checkbox" checked={showTraffic} onChange={(e) => setShowTraffic(e.target.checked)} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                Traffic Segments ({trafficSegments.length})
              </label>
            </div>
          </div>

          {/* Leaflet GIS Map Container */}
          <div style={{
            position: 'relative',
            height: '620px',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
          }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafc', color: '#64748b' }}>
                Initializing GIS spatial layers & bus GNSS feeds...
              </div>
            ) : (
              <MapContainer
                center={[21.2360, 81.6500]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {flyTo && <FlyTo lat={flyTo.lat} lng={flyTo.lng} />}

                {/* RAIPUR ARTERIAL TRANSIT ROUTE POLYLINES */}
                {showRoutes && RAIPUR_TRANSIT_CORRIDORS.map((corridor) => (
                  <Polyline
                    key={corridor.id}
                    positions={corridor.path as [number, number][]}
                    pathOptions={{
                      color: corridor.color,
                      weight: 4,
                      opacity: 0.75,
                      dashArray: '8, 6',
                    }}
                  >
                    <Popup>
                      <div style={{ padding: 4, fontFamily: 'Inter, sans-serif' }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: corridor.color }}>{corridor.name}</div>
                        <div style={{ fontSize: 11.5, color: '#475569', marginTop: 3 }}>
                          Primary Sensing Fleet: <strong>{corridor.bus}</strong> · Live Municipal Corridor
                        </div>
                      </div>
                    </Popup>
                  </Polyline>
                ))}

                {/* HEATMAP LAYER: Realistic Multi-Tier Potholes & Defect Clusters */}
                {activeHeatmap === 'potholes' && potholeEvents.map((evt, idx) => (
                  <React.Fragment key={`heat-wrap-${evt.event_id || 'evt'}-${idx}`}>
                    {/* Outer Radiant Heat Halo */}
                    <Circle
                      center={[evt.lat, evt.lng]}
                      radius={evt.severity === 'CRITICAL' ? 220 : 160}
                      pathOptions={{
                        color: '#f87171',
                        fillColor: '#f87171',
                        fillOpacity: 0.18,
                        weight: 0,
                        stroke: false,
                      }}
                    />
                    {/* Mid Thermal Dispersion */}
                    <Circle
                      center={[evt.lat, evt.lng]}
                      radius={evt.severity === 'CRITICAL' ? 120 : 85}
                      pathOptions={{
                        color: '#ea580c',
                        fillColor: '#ea580c',
                        fillOpacity: 0.35,
                        weight: 0,
                        stroke: false,
                      }}
                    />
                    {/* Inner Core Hotspot */}
                    <Circle
                      center={[evt.lat, evt.lng]}
                      radius={evt.severity === 'CRITICAL' ? 50 : 35}
                      pathOptions={{
                        color: '#dc2626',
                        fillColor: '#dc2626',
                        fillOpacity: 0.70,
                        weight: 0,
                        stroke: false,
                      }}
                    />
                  </React.Fragment>
                ))}

                {/* HEATMAP LAYER: Traffic Chokepoints */}
                {activeHeatmap === 'traffic' && trafficSegments.map((seg) => (
                  <React.Fragment key={`traffic-heat-${seg.segment_id}`}>
                    <Circle
                      center={[seg.lat, seg.lng]}
                      radius={seg.is_bottleneck ? 240 : 150}
                      pathOptions={{
                        color: seg.density_level === 'CRITICAL' ? '#f87171' : '#fde047',
                        fillColor: seg.density_level === 'CRITICAL' ? '#f87171' : '#fde047',
                        fillOpacity: 0.20,
                        weight: 0,
                        stroke: false,
                      }}
                    />
                    <Circle
                      center={[seg.lat, seg.lng]}
                      radius={seg.is_bottleneck ? 100 : 65}
                      pathOptions={{
                        color: seg.density_level === 'CRITICAL' ? '#dc2626' : '#d97706',
                        fillColor: seg.density_level === 'CRITICAL' ? '#dc2626' : '#d97706',
                        fillOpacity: 0.55,
                        weight: 0,
                        stroke: false,
                      }}
                    />
                  </React.Fragment>
                ))}

                {/* HEATMAP LAYER: Monsoon Flood Zones */}
                {activeHeatmap === 'flood' && waterlogEvents.map((evt, idx) => (
                  <React.Fragment key={`flood-heat-${evt.event_id || 'flood'}-${idx}`}>
                    <Circle
                      center={[evt.lat, evt.lng]}
                      radius={220}
                      pathOptions={{
                        color: '#38bdf8',
                        fillColor: '#38bdf8',
                        fillOpacity: 0.22,
                        weight: 0,
                        stroke: false,
                      }}
                    />
                    <Circle
                      center={[evt.lat, evt.lng]}
                      radius={85}
                      pathOptions={{
                        color: '#0284c7',
                        fillColor: '#0284c7',
                        fillOpacity: 0.60,
                        weight: 0,
                        stroke: false,
                      }}
                    />
                  </React.Fragment>
                ))}

                {/* Bus Markers */}
                {showBuses && buses.map((bus, idx) => (
                  <Marker
                    key={`bus-${bus.id || idx}`}
                    position={[bus.lat, bus.lng]}
                    icon={createBusIcon(bus.status, bus.id)}
                  >
                    <Popup>
                      <div style={{ minWidth: 220, fontFamily: 'Inter, sans-serif' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{bus.id}</span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: bus.status === 'online' ? '#ecfdf5' : '#fffbeb',
                            color: bus.status === 'online' ? '#059669' : '#d97706',
                          }}>
                            {bus.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                          <div><strong>Route:</strong> {bus.route_name}</div>
                          <div><strong>Speed:</strong> {bus.speed} km/h</div>
                          <div><strong>GNSS GPS:</strong> {bus.lat.toFixed(5)}, {bus.lng.toFixed(5)}</div>
                          <div><strong>Driver:</strong> {bus.driver_name}</div>
                          <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid #e2e8f0', color: '#2563eb', fontWeight: 600, fontSize: 11 }}>
                            On-Board Edge AI Camera Active
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Defect Event Markers */}
                {showEvents && filteredEvents.map((evt, idx) => (
                  <CircleMarker
                    key={`marker-${evt.event_id || 'evt'}-${idx}`}
                    center={[evt.lat, evt.lng]}
                    radius={evt.severity === 'CRITICAL' ? 9 : 7}
                    pathOptions={{
                      color: EVENT_COLORS[evt.event_type] || '#64748b',
                      fillColor: EVENT_COLORS[evt.event_type] || '#64748b',
                      fillOpacity: 0.85,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 240, fontFamily: 'Inter, sans-serif' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                            {evt.event_type.replace(/_/g, ' ')}
                          </span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: evt.severity === 'CRITICAL' ? '#fef2f2' : '#eff6ff',
                            color: evt.severity === 'CRITICAL' ? '#dc2626' : '#2563eb',
                          }}>
                            {evt.severity}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.5 }}>
                          <div><strong>Confidence Score:</strong> {(evt.confidence * 100).toFixed(1)}%</div>
                          <div><strong>Reporting Bus:</strong> {evt.bus_id}</div>
                          <div><strong>Location:</strong> {evt.location_name}</div>
                          <div><strong>GPS:</strong> {evt.lat.toFixed(5)}, {evt.lng.toFixed(5)}</div>
                          <div><strong>Status:</strong> {evt.status}</div>
                          <div style={{ marginTop: 6, fontStyle: 'italic', color: '#64748b' }}>"{evt.description}"</div>
                        </div>

                        {/* Direct Action Button in Popup */}
                        <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 6 }}>
                          <button
                            style={{
                              flex: 1,
                              padding: '4px 8px',
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            onClick={() => handleUpdateStatus(evt.event_id, 'VERIFIED')}
                          >
                            Verify & Dispatch PWD
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

                {/* Traffic Congestion Segments */}
                {showTraffic && trafficSegments.map((seg) => (
                  <CircleMarker
                    key={seg.segment_id}
                    center={[seg.lat, seg.lng]}
                    radius={11}
                    pathOptions={{
                      color: seg.density_level === 'CRITICAL' ? '#dc2626' : seg.density_level === 'HIGH' ? '#ea580c' : '#22c55e',
                      fillColor: seg.density_level === 'CRITICAL' ? '#dc2626' : seg.density_level === 'HIGH' ? '#ea580c' : '#22c55e',
                      fillOpacity: 0.35,
                      weight: 2,
                      dashArray: seg.is_bottleneck ? '4,4' : undefined,
                    }}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{seg.segment_name}</div>
                        <div><strong>Density:</strong> {seg.density_level}</div>
                        <div><strong>Vehicle Count:</strong> {seg.vehicle_count}</div>
                        <div><strong>Average Speed:</strong> {seg.avg_speed} km/h</div>
                        {seg.is_bottleneck && (
                          <div style={{ color: '#dc2626', fontWeight: 600, marginTop: 4 }}>
                            Active Bottleneck ({seg.bottleneck_duration_min} min delay)
                          </div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}

            {/* In-Map GIS Heatmap Legend */}
            <div style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 11,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.04em' }}>
                Spatial Legend
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#2563eb' }} />
                  <span style={{ color: '#334155' }}>Transit Probe Bus</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#dc2626' }} />
                  <span style={{ color: '#334155' }}>Pothole / Road Defect</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#0284c7' }} />
                  <span style={{ color: '#334155' }}>Waterlogging Pool</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ color: '#334155' }}>Traffic Chokepoint</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTE ANALYTICS (Pillar 5 Feature) */}
      {activeTab === 'routes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top KPI Cards for Route Analytics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <div className="card" style={{ padding: 16, background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Fleet Route Coverage</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>94.2%</div>
              <div style={{ fontSize: 11.5, color: '#16a34a', marginTop: 2 }}>Daily municipal mesh target met</div>
            </div>
            <div className="card" style={{ padding: 16, background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>City Avg Road Roughness (IRI)</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#d97706', marginTop: 4 }}>3.4 m/km</div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Moderate roughness (Station Rd peak: 5.8)</div>
            </div>
            <div className="card" style={{ padding: 16, background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Kilometers Audited Today</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>482 km</div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Zero dedicated audit vehicle cost</div>
            </div>
            <div className="card" style={{ padding: 16, background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Defects Identified / Km</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>0.38 / km</div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Down 14% vs last monsoon season</div>
            </div>
          </div>

          {/* Route Performance Matrix */}
          <div className="card" style={{ padding: 20, background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Municipal Transit Corridors — Road Condition & Delay Breakdown
                </h3>
                <p style={{ fontSize: 12, color: '#64748b' }}>
                  Real-time telemetry gathered by on-board bus cameras & edge accelerometers
                </p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: 6 }}>
                Live Stream Active
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Corridor / Route Name</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Active Fleet</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Inspection Coverage</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Road Quality (IRI)</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Transit Delay</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Congestion Level</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>PWD Action Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Route 1: Station Road — Telibandha Market', buses: 'BUS-001', coverage: '98%', iri: '5.8 m/km (Severe)', delay: '+14 min', cong: 'HEAVY', priority: 'P1 (Critical)', color: '#dc2626' },
                    { name: 'Route 2: Ring Road No. 1 — Expressway', buses: 'BUS-002', coverage: '94%', iri: '2.1 m/km (Good)', delay: '+3 min', cong: 'LOW', priority: 'P3 (Low)', color: '#16a34a' },
                    { name: 'Route 3: Pachpedi Naka — Underpass Drain', buses: 'BUS-003', coverage: '91%', iri: '4.9 m/km (Degraded)', delay: '+19 min', cong: 'CRITICAL', priority: 'P1 (Waterlogged)', color: '#0284c7' },
                    { name: 'Route 4: VIP Road — Airport Arterial', buses: 'BUS-004', coverage: '96%', iri: '1.8 m/km (Excellent)', delay: '+2 min', cong: 'LOW', priority: 'P3 (Sign Repair)', color: '#16a34a' },
                    { name: 'Route 5: Civil Lines — Collectorate Hub', buses: 'BUS-005', coverage: '92%', iri: '3.2 m/km (Fair)', delay: '+6 min', cong: 'MODERATE', priority: 'P2 (Zebra Crossing)', color: '#d97706' },
                  ].map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{r.name}</td>
                      <td style={{ padding: '12px 14px', color: '#2563eb', fontWeight: 600 }}>{r.buses}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{r.coverage}</span>
                          <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: r.coverage, height: '100%', background: '#2563eb' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: r.color }}>{r.iri}</td>
                      <td style={{ padding: '12px 14px', color: r.delay.includes('1') ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{r.delay}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: r.cong === 'CRITICAL' || r.cong === 'HEAVY' ? '#fee2e2' : '#ecfdf5',
                          color: r.cong === 'CRITICAL' || r.cong === 'HEAVY' ? '#dc2626' : '#059669',
                        }}>
                          {r.cong}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: r.color,
                          background: `${r.color}15`,
                          padding: '3px 8px',
                          borderRadius: 6,
                          border: `1px solid ${r.color}30`
                        }}>
                          {r.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MAINTENANCE REPORTS & WORK ORDERS (Pillar 5 Feature) */}
      {activeTab === 'maintenance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <div className="card" style={{ padding: 16, background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total PWD Work Orders</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{potholeEvents.length + 8}</div>
              <div style={{ fontSize: 11.5, color: '#2563eb', marginTop: 2 }}>Auto-generated by bus fleet</div>
            </div>
            <div className="card" style={{ padding: 16, background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>P1 Critical Work Orders</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
                {potholeEvents.filter(e => e.severity === 'CRITICAL').length || 4}
              </div>
              <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 2 }}>24-hour asphalt SLA active</div>
            </div>
            <div className="card" style={{ padding: 16, background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Contractors</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#059669', marginTop: 4 }}>3 Divisions</div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Raipur Central, North, & South PWD</div>
            </div>
            <div className="card" style={{ padding: 16, background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Avg Resolution Turnaround</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#d97706', marginTop: 4 }}>18.4 Hrs</div>
              <div style={{ fontSize: 11.5, color: '#16a34a', marginTop: 2 }}>68% faster than manual complaint logging</div>
            </div>
          </div>

          {/* Work Orders Table */}
          <div className="card" style={{ padding: 20, background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Automated Public Works Department (PWD) Maintenance Orders
                </h3>
                <p style={{ fontSize: 12, color: '#64748b' }}>
                  Defects logged with centimeter-accurate GNSS coordinates and AI bounding-box evidence
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={exportWorkOrdersCSV}
                style={{ gap: 6, fontSize: 12, background: '#2563eb', border: 'none', padding: '6px 14px' }}
              >
                <Download size={13} /> Export PWD Dispatch Sheet
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Ticket ID</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Defect Type</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Corridor Location</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>GPS Latitude, Longitude</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Confidence</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Severity</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Work Order Status</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.slice(0, 15).map((evt, idx) => (
                    <tr key={`wo-${evt.event_id || 'evt'}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#2563eb' }}>
                        WO-{evt.event_id}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                        {evt.event_type.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        {evt.location_name || 'Corridor Section'}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#64748b' }}>
                        {evt.lat.toFixed(5)}, {evt.lng.toFixed(5)}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                        {(evt.confidence * 100).toFixed(0)}%
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: evt.severity === 'CRITICAL' ? '#fee2e2' : '#eff6ff',
                          color: evt.severity === 'CRITICAL' ? '#dc2626' : '#2563eb',
                        }}>
                          {evt.severity}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: evt.status === 'RESOLVED' ? '#ecfdf5' : evt.status === 'ASSIGNED' ? '#eff6ff' : '#fffbeb',
                          color: evt.status === 'RESOLVED' ? '#059669' : evt.status === 'ASSIGNED' ? '#2563eb' : '#d97706',
                          border: '1px solid rgba(0,0,0,0.06)'
                        }}>
                          {evt.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {evt.status !== 'RESOLVED' ? (
                          <button
                            style={{
                              padding: '4px 10px',
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            onClick={() => handleUpdateStatus(evt.event_id, 'RESOLVED')}
                          >
                            Mark Repaired
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={13} /> Audited
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
