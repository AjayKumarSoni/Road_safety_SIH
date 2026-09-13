import { useEffect, useState } from 'react';
import { Route as RouteIcon, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { getRouteAnalytics, getCongestionAnalytics } from '../services/api';
import type { RouteData } from '../types';

const DENSITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#22c55e'
};

function DelayBar({ delay, expected }: { delay: number; expected: number }) {
  const pct = Math.min(100, (delay / expected) * 100);
  const color = pct > 60 ? '#ef4444' : pct > 30 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="progress-bar" style={{ flex: 1, height: 5 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600, width: 50 }}>+{delay}min</span>
    </div>
  );
}

export function RoutesDelays() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [odMatrix, setOdMatrix] = useState<{ zones: string[]; matrix: number[][] }>({ zones: [], matrix: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [routeData, congestion] = await Promise.all([getRouteAnalytics(), getCongestionAnalytics()]);
      setRoutes(routeData.routes);
      setOdMatrix(congestion.od_matrix);
      setLoading(false);
    };
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>;

  const totalDelay = routes.reduce((s, r) => s + r.delay_min, 0);
  const avgDelay = routes.length ? Math.round(totalDelay / routes.length) : 0;

  return (
    <div>
      <div className="page-header">
        <RouteIcon size={17} color="#06b6d4" />
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700 }}>Routes & Delays</h1>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {routes.length} routes · avg delay {avgDelay} min
          </p>
        </div>        <span style={{ marginLeft: 12 }} />
      </div>

      <div className="page-content">
        {/* Summary KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Monitored Routes', value: routes.length, color: '#38bdf8' },
            { label: 'Network Avg Delay', value: `+${avgDelay} min`, color: avgDelay > 15 ? '#ef4444' : '#f59e0b' },
            { label: 'Active Buses', value: routes.reduce((s, r) => s + r.bus_count, 0), color: '#22c55e' },
            { label: 'Total Network km', value: `${routes.reduce((s, r) => s + r.distance_km, 0).toFixed(0)} km`, color: '#8b5cf6' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ textAlign: 'center', padding: 12 }}>
              <div className="metric-label">{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Route cards */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Route Performance</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {routes.map(route => (
              <div key={route.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{route.id}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{route.name}</div>
                  </div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    background: `${DENSITY_COLORS[route.congestion_level]}18`,
                    color: DENSITY_COLORS[route.congestion_level],
                    border: `1px solid ${DENSITY_COLORS[route.congestion_level]}30`,
                  }}>{route.congestion_level}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[
                    { label: 'Expected', value: `${route.expected_time_min} min` },
                    { label: 'Actual', value: `${route.actual_time_min} min` },
                    { label: 'Delay', value: `+${route.delay_min} min`, color: DENSITY_COLORS[route.congestion_level] },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'center', padding: 6, background: 'var(--color-surface-2)', borderRadius: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: color || 'var(--color-text-primary)' }}>{value}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 3 }}>Delay indicator</div>
                  <DelayBar delay={route.delay_min} expected={route.expected_time_min} />
                </div>

                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
                  <span>{route.bus_count} buses</span>
                  <span>{route.avg_speed} km/h avg</span>
                  <span>{route.distance_km} km</span>
                </div>

                {/* Waypoints */}
                {route.waypoints && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {route.waypoints.map((wp, i) => (
                      <span key={i}>{i > 0 && ' → '}{wp.name}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* OD Matrix */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrendingUp size={15} color="#3b82f6" />
            <h3 style={{ fontSize: 13, fontWeight: 600 }}>Origin-Destination Matrix</h3>
            <span className="badge badge-sim">Estimated from simulated fleet telemetry</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}>From ↓ / To →</th>
                  {odMatrix.zones.map(z => (
                    <th key={z} style={{ padding: '6px 12px', textAlign: 'center', color: '#3b82f6', background: 'var(--color-surface-2)', whiteSpace: 'pre-line' }}>{z}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {odMatrix.zones.map((zone, ri) => (
                  <tr key={zone}>
                    <td style={{ padding: '6px 12px', fontWeight: 600, color: '#3b82f6', background: 'var(--color-surface-2)', whiteSpace: 'pre-line' }}>{zone}</td>
                    {odMatrix.matrix[ri]?.map((val, ci) => (
                      <td key={ci} style={{
                        padding: '6px 12px', textAlign: 'center',
                        background: ci === ri ? 'var(--color-surface-2)' : val > 600 ? 'rgba(239,68,68,0.08)' : val > 400 ? 'rgba(245,158,11,0.06)' : undefined,
                        color: ci === ri ? 'var(--color-text-muted)' : val > 600 ? '#ef4444' : val > 400 ? '#f59e0b' : 'var(--color-text-secondary)',
                        fontWeight: val > 600 ? 700 : undefined,
                        borderBottom: '1px solid var(--color-border)',
                      }}>
                        {ci === ri ? '—' : val.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
            Values represent estimated daily trips. Higher values in red. Generated from simulated bus trajectory data.
          </div>
        </div>
      </div>
    </div>
  );
}
