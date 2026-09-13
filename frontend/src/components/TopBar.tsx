import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useStore } from '../store/useStore';
import * as api from '../services/api';

export function TopBar() {
  const navigate = useNavigate();
  const { simRunning, alertCount, setSimRunning } = useStore();

  useEffect(() => {
    if (!simRunning) {
      api.startSim().then(() => setSimRunning(true)).catch(() => {});
    }
  }, []);

  return (
    <header style={{
      height: 56,
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 24px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Brand & Context */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            RakshAI
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            background: '#ecfdf5',
            color: '#059669',
            border: '1px solid #a7f3d0',
            padding: '1px 6px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Command Hub
          </span>
        </div>
        <span style={{ color: '#cbd5e1' }}>•</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#475569' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span>Raipur Municipal Fleet — 5 Active Transit Buses</span>
        </div>
      </div>

      {/* Fleet Controls & Real-Time Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Real-time Ingestion Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          color: '#059669',
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#10b981',
            display: 'inline-block',
            boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)'
          }} />
          <span>Real-Time Stream · 5 Buses Connected</span>
        </div>

        {/* Priority Alert Bell */}
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => navigate('/incidents')}
          style={{
            position: 'relative',
            padding: '7px 10px',
            color: alertCount > 0 ? '#dc2626' : '#64748b',
            border: alertCount > 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0',
            borderRadius: 8,
            background: alertCount > 0 ? '#fef2f2' : '#ffffff',
            cursor: 'pointer',
          }}
          title="Active Priority Alerts"
        >
          <Bell size={15} />
          {alertCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#dc2626',
              color: '#fff',
              borderRadius: 10,
              padding: '1px 5px',
              fontSize: 9.5,
              fontWeight: 700,
            }}>
              {alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
