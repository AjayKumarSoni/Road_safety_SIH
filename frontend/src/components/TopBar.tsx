import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck, AlertTriangle, ShieldAlert, ArrowRight, MapPin, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import * as api from '../services/api';

export function TopBar() {
  const navigate = useNavigate();
  const { simRunning, alertCount, setSimRunning, clearAlerts, events, incidents } = useStore();
  const [openNotifications, setOpenNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!simRunning) {
      api.startSim().then(() => setSimRunning(true)).catch(() => {});
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenNotifications(false);
      }
    }
    if (openNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openNotifications]);

  // Combine top urgent notices
  const urgentAlerts = [
    ...incidents.slice(0, 3).map((i) => ({
      id: i.incident_id,
      title: i.incident_type.replace(/_/g, ' '),
      severity: i.severity,
      location: i.location_name,
      time: i.timestamp,
      type: 'incident' as const,
      desc: i.notes || `${i.vehicle_type} (${i.registration || 'Vehicle'}) flagged for safety audit.`,
    })),
    ...events.filter((e) => e.severity === 'CRITICAL').slice(0, 3).map((e) => ({
      id: e.event_id,
      title: e.event_type.replace(/_/g, ' '),
      severity: e.severity,
      location: e.location_name,
      time: e.timestamp,
      type: 'road' as const,
      desc: e.description,
    })),
  ];

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }} ref={dropdownRef}>
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

        {/* Priority Alert Bell Button */}
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => setOpenNotifications(!openNotifications)}
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

        {/* Interactive Notification Popover Panel */}
        {openNotifications && (
          <div style={{
            position: 'absolute',
            top: 48,
            right: 0,
            width: 380,
            maxHeight: 480,
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Notification Header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={15} color="#dc2626" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  City Safety Alerts ({alertCount})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {alertCount > 0 && (
                  <button
                    onClick={() => clearAlerts()}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#2563eb',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CheckCheck size={13} /> Mark read
                  </button>
                )}
                <button
                  onClick={() => setOpenNotifications(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 2,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div style={{ overflowY: 'auto', maxHeight: 340, padding: 8 }}>
              {urgentAlerts.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  No unread alerts. All city corridors normal.
                </div>
              ) : (
                urgentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setOpenNotifications(false);
                      if (alert.type === 'incident') navigate('/incidents');
                      else navigate('/roads');
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: '#ffffff',
                      border: '1px solid #f1f5f9',
                      marginBottom: 6,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        {alert.type === 'incident' ? (
                          <ShieldAlert size={14} color="#dc2626" />
                        ) : (
                          <AlertTriangle size={14} color="#ea580c" />
                        )}
                        {alert.title}
                      </span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: alert.severity === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
                        color: alert.severity === 'CRITICAL' ? '#dc2626' : '#d97706',
                        border: alert.severity === 'CRITICAL' ? '1px solid #fecaca' : '1px solid #fde68a',
                      }}>
                        {alert.severity}
                      </span>
                    </div>

                    <div style={{ fontSize: 11.5, color: '#475569', marginBottom: 5, lineHeight: 1.4 }}>
                      {alert.desc}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: '#94a3b8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} /> {alert.location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {alert.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Notification Footer Links */}
            <div style={{
              padding: '10px 14px',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <button
                onClick={() => { setOpenNotifications(false); navigate('/roads'); }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#2563eb',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Road Hazards <ArrowRight size={12} />
              </button>
              <button
                onClick={() => { setOpenNotifications(false); navigate('/incidents'); }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#dc2626',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Traffic Incidents <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
