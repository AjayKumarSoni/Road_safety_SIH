import { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getTraffic, getBottlenecks, getCongestionAnalytics } from '../services/api';
import type { TrafficSegment } from '../types';

const DENSITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#22c55e'
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'];

export function TrafficIntelligence() {
  const [segments, setSegments] = useState<TrafficSegment[]>([]);
  const [bottlenecks, setBottlenecks] = useState<any[]>([]);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [t, b, c] = await Promise.all([getTraffic(), getBottlenecks(), getCongestionAnalytics()]);
      setSegments(t.segments);
      setBottlenecks(b.bottlenecks);
      setTimeSeries(c.time_series);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, []);

  const totalVehicles = segments.reduce((s, seg) => s + seg.vehicle_count, 0);
  const totalCars = segments.reduce((s, seg) => s + seg.cars, 0);
  const totalBikes = segments.reduce((s, seg) => s + seg.bikes, 0);
  const totalBuses = segments.reduce((s, seg) => s + seg.buses, 0);
  const totalTrucks = segments.reduce((s, seg) => s + seg.trucks, 0);
  const totalAutos = segments.reduce((s, seg) => s + seg.autos, 0);

  const pieData = [
    { name: 'Cars', value: totalCars },
    { name: 'Bikes', value: totalBikes },
    { name: 'Buses', value: totalBuses },
    { name: 'Trucks', value: totalTrucks },
    { name: 'Autos', value: totalAutos },
  ];

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <TrendingUp size={17} color="#f59e0b" />
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700 }}>Traffic Intelligence</h1>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {segments.length} segments monitored · {bottlenecks.length} bottlenecks active
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total Vehicles', value: totalVehicles.toLocaleString(), color: '#3b82f6' },
            { label: 'Cars', value: totalCars, color: '#22c55e' },
            { label: 'Bikes', value: totalBikes, color: '#f59e0b' },
            { label: 'Buses', value: totalBuses, color: '#8b5cf6' },
            { label: 'Trucks', value: totalTrucks, color: '#ef4444' },
            { label: 'Autos', value: totalAutos, color: '#06b6d4' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ textAlign: 'center' }}>
              <div className="metric-label">{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Vehicle type chart */}
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Vehicle Classification</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => Number(v || 0).toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic by time */}
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Traffic Volume — Today</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeSeries}>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#4a5a7a' }} />
                <YAxis tick={{ fontSize: 10, fill: '#4a5a7a' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 12 }}
                />
                <Bar dataKey="vehicles" fill="#3b82f6" radius={[2, 2, 0, 0]}
                  label={false}
                  name="Vehicles"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottlenecks */}
        {bottlenecks.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} color="#ef4444" />
              Active Bottlenecks ({bottlenecks.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {bottlenecks.map((b: any) => (
                <div key={b.segment_id} className="card-sm" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#ef4444' }}>
                    {b.segment_name}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px', fontSize: 12 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Density:</span>
                    <span style={{ color: DENSITY_COLORS[b.density_level], fontWeight: 600 }}>{b.density_level}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>Avg Speed:</span>
                    <span>{b.avg_speed} km/h</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>Vehicles:</span>
                    <span>{b.vehicle_count}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>Duration:</span>
                    <span style={{ color: '#f59e0b' }}>{b.duration_min} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All segments table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600 }}>All Traffic Segments</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Segment</th>
                <th>Density</th>
                <th>Vehicles</th>
                <th>Avg Speed</th>
                <th>Cars</th>
                <th>Bikes</th>
                <th>Trucks</th>
                <th>Bottleneck</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {segments.map(seg => (
                <tr key={seg.segment_id}>
                  <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{seg.segment_name}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: `${DENSITY_COLORS[seg.density_level]}18`,
                      color: DENSITY_COLORS[seg.density_level],
                      border: `1px solid ${DENSITY_COLORS[seg.density_level]}30`,
                    }}>{seg.density_level}</span>
                  </td>
                  <td>{seg.vehicle_count}</td>
                  <td>{seg.avg_speed.toFixed(1)} km/h</td>
                  <td>{seg.cars}</td>
                  <td>{seg.bikes}</td>
                  <td>{seg.trucks}</td>
                  <td>{seg.is_bottleneck ? <span style={{ color: '#ef4444', fontWeight: 600 }}>YES</span> : '—'}</td>
                  <td>{seg.is_bottleneck ? `${seg.bottleneck_duration_min} min` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
