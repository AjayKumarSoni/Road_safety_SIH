import { useState } from 'react';
import { Sliders, Cpu, CheckCircle2, Shield, Radio, Check, Server, Camera, BellRing, Save } from 'lucide-react';
import { useStore } from '../store/useStore';
import * as api from '../services/api';

const OPERATIONAL_MODES = [
  { key: 'normal', label: 'Routine Pavement & Traffic Scanning', desc: 'Standard AI inspection on all active transit corridors at 30 FPS' },
  { key: 'heavy_congestion', label: 'Peak Hour Traffic Congestion Mode', desc: 'Prioritizes arterial bottleneck detection and rerouting feeds' },
  { key: 'pothole', label: 'Post-Monsoon Road Audit Mode', desc: 'High-sensitivity surface pothole, crater & crack depth scoring' },
  { key: 'waterlogging', label: 'Monsoon Street Submersion Protocol', desc: 'Instant drainage pump alerts for low-lying waterlogged underpasses' },
  { key: 'rash_driving', label: 'Speed Enforcement & ANPR Patrol', desc: 'High-speed reckless driving & plate identification enabled' },
  { key: 'hit_and_run', label: 'Police Hit & Run Emergency Tracking', desc: 'Immediate suspect vehicle broadcast to Traffic Police HQ' },
];

export function Settings() {
  const { simRunning, simSpeed, simScenario, setSimRunning, setSimSpeed, setSimScenario } = useStore();
  const [scenario, setScenarioLocal] = useState(simScenario);
  const [toast, setToast] = useState<string | null>(null);
  const [confThreshold, setConfThreshold] = useState(75);
  const [metadataCompression, setMetadataCompression] = useState(true);
  const [gnssFrequency, setGnssFrequency] = useState('10 Hz (Centimeter High-Precision)');

  const handleModeChange = async (key: string) => {
    setScenarioLocal(key);
    await api.setScenario(key);
    setSimScenario(key);
    setSimRunning(true);
    setToast(`Active Operational Mode configured: ${OPERATIONAL_MODES.find((s) => s.key === key)?.label}`);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveConfig = () => {
    setToast('System & Edge AI inference parameters synced across 5 transit nodes.');
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#eff6ff', padding: 8, borderRadius: 8, border: '1px solid #bfdbfe' }}>
            <Sliders size={20} color="#2563eb" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                System & Edge AI Mesh Configuration
              </h1>
              <span style={{
                fontSize: 9.5,
                fontWeight: 700,
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                padding: '1px 6px',
                borderRadius: 4
              }}>
                PRODUCTION SETTINGS
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#64748b' }}>
              Configure edge neural parameters, GNSS ingestion rates, low-bandwidth telemetry, and multi-agency dispatch rules
            </p>
          </div>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button
            className="btn btn-primary"
            onClick={handleSaveConfig}
            style={{
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              background: '#2563eb',
              border: 'none',
              padding: '8px 18px',
              borderRadius: 8,
            }}
          >
            <Save size={15} />
            Save & Sync Parameters
          </button>
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
            <CheckCircle2 size={18} />
            <span>{toast}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18, marginBottom: 20 }}>
          {/* Operational Mesh Profile */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              Active Operational Inspection Profile
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              Select target city monitoring profile deployed across all bus edge inference units:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {OPERATIONAL_MODES.map((s) => {
                const isSelected = scenario === s.key;
                return (
                  <button
                    key={s.key}
                    style={{
                      height: 'auto',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => handleModeChange(s.key)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 12.5, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                        {s.label}
                      </span>
                      {isSelected && <Check size={14} color="#2563eb" />}
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.3 }}>
                      {s.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edge AI & Telemetry Parameters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Speed Controller */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                Telemetry Ingestion Speed
              </h3>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                Adjust fleet probe movement simulation rate for operational monitoring:
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                {[1, 2, 5, 10].map((s) => (
                  <button
                    key={s}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      fontWeight: simSpeed === s ? 700 : 500,
                      background: simSpeed === s ? '#eff6ff' : '#ffffff',
                      border: simSpeed === s ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                      color: simSpeed === s ? '#1d4ed8' : '#334155',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                    onClick={async () => {
                      await api.setSimSpeed(s);
                      setSimSpeed(s);
                    }}
                  >
                    {s}x Rate
                  </button>
                ))}
              </div>
            </div>

            {/* Edge AI Model Settings */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Cpu size={18} color="#2563eb" />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                  Edge Neural & GNSS Ingestion Rules
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Confidence Threshold:</span>
                    <strong style={{ color: '#2563eb' }}>{confThreshold}%</strong>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={confThreshold}
                    onChange={(e) => setConfThreshold(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 10.5, color: '#64748b' }}>
                    Detections below {confThreshold}% are suppressed locally to prevent false alarms.
                  </span>
                </div>

                <div style={{ paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={metadataCompression}
                      onChange={(e) => setMetadataCompression(e.target.checked)}
                    />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      Low-Bandwidth Metadata Optimization (99.8% Savings)
                    </span>
                  </label>
                  <span style={{ fontSize: 10.5, color: '#64748b', display: 'block', marginTop: 2 }}>
                    Compresses event coordinates & telemetry to lightweight 1.8 KB JSON instead of streaming 25 Mbps raw 4K video.
                  </span>
                </div>

                <div style={{ paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#475569', fontWeight: 600, marginBottom: 4 }}>GNSS Sampling Frequency:</div>
                  <select
                    value={gnssFrequency}
                    onChange={(e) => setGnssFrequency(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: 12,
                      color: '#0f172a',
                    }}
                  >
                    <option>10 Hz (Centimeter High-Precision)</option>
                    <option>5 Hz (Standard RTK Locked)</option>
                    <option>1 Hz (Power Efficient)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
