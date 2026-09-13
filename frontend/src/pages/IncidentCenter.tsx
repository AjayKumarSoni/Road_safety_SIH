import { useEffect, useState } from 'react';
import { ShieldAlert, Search, CheckCircle } from 'lucide-react';
import { getIncidents, updateIncident } from '../services/api';
import { useStore } from '../store/useStore';
import type { Incident } from '../types';

const TYPE_LABELS: Record<string, string> = {
  HIT_AND_RUN: 'Hit & Run Suspect',
  RASH_DRIVING: 'Reckless / Rash Driving',
  COLLISION: 'Vehicle Collision',
  PEDESTRIAN_RISK: 'Pedestrian Proximity Hazard',
  SUDDEN_BRAKING: 'Sudden Emergency Braking',
  DANGEROUS_MANOEUVRE: 'Dangerous Lane Manoeuvre',
};

export function IncidentCenter() {
  const { incidents, setIncidents } = useStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    const data = await getIncidents({ limit: 100 });
    setIncidents(data.incidents);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const handleUpdateStatus = async (inc: Incident, status: string) => {
    await updateIncident(inc.incident_id, { status });
    setToast(`Incident ${inc.incident_id} marked as ${status}`);
    setTimeout(() => setToast(null), 4000);
    load();
  };

  const filtered = incidents.filter((i) => {
    const matchSearch =
      !search ||
      i.incident_id.toLowerCase().includes(search.toLowerCase()) ||
      (i.registration && i.registration.toLowerCase().includes(search.toLowerCase())) ||
      (i.location_name && i.location_name.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#fef2f2', padding: 8, borderRadius: 8, border: '1px solid #fecaca' }}>
            <ShieldAlert size={20} color="#dc2626" />
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              Traffic & Incident Intelligence
            </h1>
            <p style={{ fontSize: 12, color: '#64748b' }}>
              Automatic Number Plate Recognition (ANPR), rash driving detection, and hit-and-run tracking
            </p>
          </div>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Search plate or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '6px 12px 6px 30px',
                color: '#0f172a',
                fontSize: 12,
                width: 220,
              }}
            />
            <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 10 }} />
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Toast */}
        {toast && (
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
            <span>{toast}</span>
          </div>
        )}

        {/* 4 Clean Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Incidents
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
              {incidents.filter((i) => i.status === 'NEW').length}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Action required</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Hit & Run Plates
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
              {incidents.filter((i) => i.incident_type === 'HIT_AND_RUN').length}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Preserved with GPS & time</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Pedestrian Risk Spots
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#d97706', marginTop: 4 }}>
              {incidents.filter((i) => i.incident_type === 'PEDESTRIAN_RISK').length}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Crosswalk proximity alerts</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              ANPR Accuracy
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#059669', marginTop: 4 }}>
              98.6%
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>High-confidence OCR</div>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Violation Type</th>
                <th>Vehicle Model</th>
                <th>License Plate (ANPR)</th>
                <th>Confidence</th>
                <th>Severity</th>
                <th>Location</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc, idx) => (
                <tr key={`inc-${inc.incident_id || 'inc'}-${idx}`}>
                  <td style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, color: '#64748b' }}>
                    {inc.incident_id}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>
                    {TYPE_LABELS[inc.incident_type] || inc.incident_type}
                  </td>
                  <td style={{ fontSize: 12.5, color: '#475569' }}>
                    {inc.vehicle_type || 'Vehicle'}
                  </td>
                  <td>
                    {inc.registration ? (
                      <span style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontWeight: 700,
                        fontSize: 12,
                        background: '#f1f5f9',
                        color: '#0f172a',
                        padding: '2px 8px',
                        borderRadius: 4,
                        border: '1px solid #cbd5e1',
                      }}>
                        {inc.registration}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>Unidentified</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    {(inc.confidence * 100).toFixed(0)}%
                  </td>
                  <td>
                    <span className={`badge ${inc.severity === 'CRITICAL' ? 'badge-red' : inc.severity === 'HIGH' ? 'badge-amber' : 'badge-blue'}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td style={{ fontSize: 12.5, color: '#334155' }}>
                    {inc.location_name || 'City Corridor'}
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: inc.status === 'RESOLVED' ? '#059669' : inc.status === 'ASSIGNED' ? '#2563eb' : '#dc2626',
                    }}>
                      {inc.status}
                    </span>
                  </td>
                  <td>
                    {inc.status !== 'RESOLVED' ? (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleUpdateStatus(inc, 'RESOLVED')}
                        style={{ fontSize: 11, padding: '3px 8px', color: '#059669', borderColor: '#a7f3d0' }}
                      >
                        Resolve
                      </button>
                    ) : (
                      <span style={{ fontSize: 11.5, color: '#059669', fontWeight: 600 }}>Resolved</span>
                    )}
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
