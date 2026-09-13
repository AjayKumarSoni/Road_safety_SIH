import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { getEvents, updateEvent } from '../services/api';
import { useStore } from '../store/useStore';
import type { Event } from '../types';

const TYPE_LABELS: Record<string, string> = {
  POTHOLE: 'Road Pothole',
  WATERLOGGING: 'Street Waterlogging',
  DAMAGED_ROAD: 'Damaged Surface',
  ROAD_DEBRIS: 'Road Obstacle / Debris',
  OPEN_MANHOLE: 'Open Manhole',
  MISSING_ZEBRA_CROSSING: 'Faded Crosswalk',
  MISSING_ROAD_DIVIDER: 'Broken Divider',
  DAMAGED_TRAFFIC_SIGN: 'Damaged Signboard',
  MISSING_TRAFFIC_SIGN: 'Missing Signboard',
};

const ALL_TYPES = ['All Hazards', ...Object.keys(TYPE_LABELS)];
const ALL_SEVERITIES = ['All Severities', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function RoadConditions() {
  const { events, setEvents, updateEvent: updateStoreEvent } = useStore();
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('All Hazards');
  const [filterSev, setFilterSev] = useState('All Severities');
  const [search, setSearch] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await getEvents({ limit: 100 });
      if (data?.events?.length) setEvents(data.events);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 7000);
    return () => clearInterval(t);
  }, []);

  const ROAD_TYPES = Object.keys(TYPE_LABELS);
  const roadEvents = events.filter((e) => ROAD_TYPES.includes(e.event_type));

  const filtered = roadEvents.filter((e) => {
    const matchType = filterType === 'All Hazards' || e.event_type === filterType;
    const matchSev = filterSev === 'All Severities' || e.severity === filterSev;
    const matchSearch =
      !search ||
      e.event_id.toLowerCase().includes(search.toLowerCase()) ||
      e.bus_id.toLowerCase().includes(search.toLowerCase()) ||
      (e.location_name && e.location_name.toLowerCase().includes(search.toLowerCase()));

    return matchType && matchSev && matchSearch;
  });

  const handleStatusChange = async (evt: Event, status: any) => {
    updateStoreEvent(evt.event_id, { status });
    setSuccessToast(`Work order updated: ${evt.event_id} marked as ${status}`);
    setTimeout(() => setSuccessToast(null), 4000);
    try {
      await updateEvent(evt.event_id, { status });
    } catch {}
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#fffbeb', padding: 8, borderRadius: 8, border: '1px solid #fde68a' }}>
            <AlertTriangle size={20} color="#d97706" />
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              Road Hazards & Safety Repairs
            </h1>
            <p style={{ fontSize: 12, color: '#64748b' }}>
              Potholes, surface cracks, missing signs, and waterlogging logged by mobile bus cameras
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Search corridor or bus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '6px 12px 6px 30px',
                color: '#0f172a',
                fontSize: 12,
                width: 200,
              }}
            />
            <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 10 }} />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#334155',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
            }}
          >
            {ALL_TYPES.map((o) => (
              <option key={o} value={o}>{TYPE_LABELS[o] || o}</option>
            ))}
          </select>

          <select
            value={filterSev}
            onChange={(e) => setFilterSev(e.target.value)}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#334155',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
            }}
          >
            {ALL_SEVERITIES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="page-content">
        {/* Toast */}
        {successToast && (
          <div style={{
            marginBottom: 16,
            padding: '12px 18px',
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
            <CheckCircle size={18} />
            <span>{successToast}</span>
          </div>
        )}

        {/* 4 Clean Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Hazards Logged</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{roadEvents.length}</div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Citywide audit</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Potholes Detected</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
              {roadEvents.filter((e) => e.event_type === 'POTHOLE').length}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Depth mapped & geo-tagged</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Waterlogged Spots</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
              {roadEvents.filter((e) => e.event_type === 'WATERLOGGING').length}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Underpasses & drains</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>PWD Repairs Complete</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#059669', marginTop: 4 }}>
              {roadEvents.filter((e) => e.status === 'RESOLVED').length}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Work orders verified</div>
          </div>
        </div>

        {/* Hazard List Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Hazard ID</th>
                <th>Defect Category</th>
                <th>Reporting Bus</th>
                <th>Location / Corridor</th>
                <th>Confidence</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((evt, idx) => (
                <tr key={`${evt.event_id || 'evt'}-${idx}`}>
                  <td style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, color: '#64748b' }}>
                    {evt.event_id}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>
                    {TYPE_LABELS[evt.event_type] || evt.event_type}
                  </td>
                  <td>
                    <span className="badge badge-blue">{evt.bus_id}</span>
                  </td>
                  <td style={{ fontSize: 12.5, color: '#334155' }}>
                    {evt.location_name || 'City Corridor'}
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    {(evt.confidence * 100).toFixed(0)}%
                  </td>
                  <td>
                    <span className={`badge ${evt.severity === 'CRITICAL' ? 'badge-red' : evt.severity === 'HIGH' ? 'badge-amber' : 'badge-blue'}`}>
                      {evt.severity}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: evt.status === 'RESOLVED' ? '#059669' : evt.status === 'ASSIGNED' ? '#2563eb' : '#d97706',
                    }}>
                      {evt.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {evt.status === 'NEW' && (
                        <button
                          className="btn btn-sm"
                          onClick={() => handleStatusChange(evt, 'ASSIGNED')}
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            color: '#2563eb',
                            borderColor: '#bfdbfe',
                            background: '#eff6ff',
                            cursor: 'pointer'
                          }}
                        >
                          Assign
                        </button>
                      )}
                      {evt.status !== 'RESOLVED' ? (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleStatusChange(evt, 'RESOLVED')}
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            color: '#059669',
                            borderColor: '#a7f3d0',
                            background: '#ecfdf5',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Repaired
                        </button>
                      ) : (
                        <span style={{ fontSize: 11.5, color: '#059669', fontWeight: 600 }}>Repaired ✓</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
