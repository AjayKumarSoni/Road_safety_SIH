import { useEffect, useState } from 'react';
import { Building2, AlertTriangle, CheckCircle } from 'lucide-react';
import { getInfraAnalytics, getEvents } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const INFRA_TYPES: Record<string, { label: string; color: string }> = {
  potholes: { label: 'Potholes', color: '#ef4444' },
  waterlogging: { label: 'Waterlogging', color: '#3b82f6' },
  damaged_roads: { label: 'Damaged Roads', color: '#f97316' },
  missing_signs: { label: 'Missing Signs', color: '#8b5cf6' },
  damaged_signs: { label: 'Damaged Signs', color: '#f59e0b' },
  missing_zebra_crossings: { label: 'Missing Zebra Crossings', color: '#ec4899' },
  missing_dividers: { label: 'Missing Dividers', color: '#f97316' },
  open_manholes: { label: 'Open Manholes', color: '#dc2626' },
  road_debris: { label: 'Road Debris', color: '#6b7280' },
};

export function Infrastructure() {
  const [infra, setInfra] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getInfraAnalytics();
      setInfra(data);
      setLoading(false);
    };
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const chartData = Object.entries(INFRA_TYPES).map(([key, meta]) => ({
    name: meta.label.split(' ').slice(-1)[0],
    fullName: meta.label,
    value: infra[key] || 0,
    color: meta.color,
  }));

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <Building2 size={17} color="#8b5cf6" />
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700 }}>Infrastructure Intelligence</h1>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Road infrastructure deficiency analytics</p>
        </div>
      </div>

      <div className="page-content">
        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
          {Object.entries(INFRA_TYPES).map(([key, meta]) => {
            const count = infra[key] || 0;
            return (
              <div key={key} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${meta.color}` }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: meta.color, marginTop: 4 }}>{count}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{meta.label}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Bar chart */}
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Infrastructure Issues by Type</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: '#4a5a7a' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#8b9dbf' }} width={80} />
                <Tooltip
                  formatter={(v: any, _: any, props: any) => [v, props?.payload?.fullName]}
                  contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status breakdown */}
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Event Status Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'New', key: 'new', color: '#ef4444' },
                { label: 'Verified', key: 'verified', color: '#f59e0b' },
                { label: 'Assigned', key: 'assigned', color: '#3b82f6' },
                { label: 'Resolved', key: 'resolved', color: '#22c55e' },
              ].map(({ label, key, color }) => {
                const count = infra[key] || 0;
                const total = (infra.total_events || 1);
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                      <span style={{ color, fontWeight: 600 }}>{count} ({pct}%)</span>
                    </div>
                    <div className="progress-bar" style={{ height: 6 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, padding: 10, background: 'var(--color-surface-2)', borderRadius: 6, fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Total Events Logged</span>
                <span style={{ fontWeight: 700, color: '#3b82f6' }}>{infra.total_events}</span>
              </div>
            </div>
          </div>
        </div>

        {/* By bus breakdown */}
        {infra.by_bus && (
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Events by Bus</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              {Object.entries(infra.by_bus).map(([busId, count]: [string, any]) => (
                <div key={busId} className="card-sm" style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: 18 }}>{count}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{busId}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
