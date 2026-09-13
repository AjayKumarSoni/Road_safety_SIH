import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Map, Bus, AlertTriangle,
  ShieldAlert, FileText
} from 'lucide-react';
import { useStore } from '../store/useStore';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Command Center' },
  { to: '/gis', icon: Map, label: 'GIS Map & Road Hotspots' },
  { to: '/fleet', icon: Bus, label: 'Live Bus Cameras' },
  { to: '/roads', icon: AlertTriangle, label: 'Road Hazards & Repairs' },
  { to: '/incidents', icon: ShieldAlert, label: 'Traffic & Safety Incidents' },
  { to: '/reports', icon: FileText, label: 'City Work Reports' },
];

export function Sidebar() {
  const { wsConnected, simRunning, alertCount } = useStore();

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 100,
      overflowY: 'auto',
    }}>
      {/* Brand Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <img
            src="/favicon.svg"
            alt="RakshAI Logo"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              padding: 2,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
              RakshAI
              <span style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: '#059669',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '1px 5px',
                borderRadius: 4,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* City Location Indicator */}
        <div style={{
          marginTop: 10,
          padding: '4px 8px',
          borderRadius: 6,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          fontSize: 10.5,
          fontWeight: 600,
          color: '#475569',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          Raipur Municipal Coverage Active
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ flex: 1, padding: '14px 10px' }}>
        <div style={{
          padding: '0 12px 8px',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#94a3b8'
        }}>
          Navigation
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 12px',
                textDecoration: 'none',
                borderRadius: 8,
                color: isActive ? '#2563eb' : '#475569',
                background: isActive ? '#eff6ff' : 'transparent',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.15s ease',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} color={isActive ? '#2563eb' : '#64748b'} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {label === 'Traffic & Safety Incidents' && alertCount > 0 && (
                    <span style={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fca5a5',
                      borderRadius: 10,
                      padding: '1px 6px',
                      fontSize: 10,
                      fontWeight: 700,
                    }}>{alertCount}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Clean System Status Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #f1f5f9',
        fontSize: 11,
        background: '#f8fafc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: simRunning ? '#10b981' : '#f59e0b' }} />
          <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 11.5 }}>
            {simRunning ? 'Bus Cameras: Scanning' : 'Bus Cameras: Standby'}
          </span>
        </div>
        <div style={{ color: '#64748b', fontSize: 11 }}>
          {wsConnected ? 'All 5 Transit Buses Active' : 'Connecting to Fleet...'}
        </div>
      </div>
    </aside>
  );
}
