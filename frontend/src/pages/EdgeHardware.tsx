import { useEffect, useState } from 'react';
import { Cpu, Thermometer, HardDrive, Wifi, Camera, Navigation, Zap, Activity } from 'lucide-react';
import { getEdgeNodes } from '../services/api';
import type { EdgeNode } from '../types';

function GaugeBar({ label, value, max = 100, unit = '%', warn = 70, danger = 85 }: {
  label: string; value: number; max?: number; unit?: string; warn?: number; danger?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= danger ? '#ef4444' : value >= warn ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{value.toFixed(1)}{unit}</span>
      </div>
      <div className="progress-bar" style={{ height: 5 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function DeviceItem({ icon: Icon, label, value, ok }: { icon: React.ElementType; label: string; value: string; ok?: boolean }) {
  const color = ok === undefined ? 'var(--color-text-muted)' : ok ? '#22c55e' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
      <Icon size={14} color={color} />
      <span style={{ flex: 1, fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
      <span className={`pulse-dot ${ok ? 'green' : ok === false ? 'red' : 'amber'}`} />
    </div>
  );
}

function EdgeNodeCard({ node }: { node: EdgeNode }) {
  const statusColor = node.status === 'online' ? '#22c55e' : node.status === 'warning' ? '#f59e0b' : '#6b7280';

  return (
    <div className="card" style={{ border: `1px solid ${statusColor}30` }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{node.bus_id}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{node.route_name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className={`badge ${node.status === 'online' ? 'badge-green' : node.status === 'warning' ? 'badge-amber' : 'badge-gray'}`}>
            {node.status.toUpperCase()}
          </span>
          <div className="sim-tag" style={{ display: 'block', marginTop: 3 }}>SIMULATED EDGE DEVICE</div>
        </div>
      </div>

      {/* Device model */}
      <div style={{
        background: 'var(--color-surface-2)', borderRadius: 6, padding: 8, marginBottom: 12,
        border: '1px solid var(--color-border-2)', fontSize: 11, color: 'var(--color-text-secondary)',
      }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{node.device_model}</div>
        <div>AI Engine: {node.ai_engine}</div>
        <div>Uptime: {node.uptime_hours}h · Events/min: ~{node.events_per_min}</div>
      </div>

      {/* Resource usage */}
      <GaugeBar label="CPU Usage" value={node.cpu_usage} warn={65} danger={80} />
      <GaugeBar label="RAM Usage" value={node.ram_usage} warn={70} danger={85} />
      <GaugeBar label="Temperature" value={node.temperature} max={100} unit="°C" warn={60} danger={75} />
      <GaugeBar label="Storage" value={node.storage_usage} warn={80} danger={90} />

      {/* AI */}
      <div style={{ marginBottom: 10, marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>AI Processing</span>
          <span style={{ color: node.ai_status === 'RUNNING' ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
            {node.ai_fps} FPS · {node.ai_status}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Bandwidth Saved</span>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>{node.bandwidth_saved_pct}% (Estimated)</span>
        </div>
      </div>

      {/* Connected devices */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        Connected Devices
      </div>
      <DeviceItem icon={Camera} label="Front Camera" value={node.camera_front ? 'Online' : 'Offline'} ok={node.camera_front} />
      <DeviceItem icon={Camera} label="Rear Camera" value={node.camera_rear ? 'Online' : 'Offline'} ok={node.camera_rear} />
      <DeviceItem icon={Camera} label="Left Camera" value={node.camera_left ? 'Online' : 'Offline'} ok={node.camera_left} />
      <DeviceItem icon={Camera} label="Right Camera" value={node.camera_right ? 'Online' : 'Offline'} ok={node.camera_right} />
      <DeviceItem icon={Navigation} label="GPS Module" value={node.gps_status} ok={node.gps_status === 'LOCKED'} />
      <DeviceItem icon={Activity} label="IMU Sensor" value={node.imu_status} ok={node.imu_status === 'ACTIVE'} />
      <DeviceItem icon={Wifi} label="4G/5G Modem" value={`${node.network_type} · ${node.network_signal} dBm`} ok={node.status !== 'offline'} />
      <DeviceItem icon={Zap} label="AI Engine" value={node.ai_status} ok={node.ai_status === 'RUNNING'} />
    </div>
  );
}

export function EdgeHardware() {
  const [nodes, setNodes] = useState<EdgeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getEdgeNodes();
      setNodes(data.nodes);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="page-header">
        <Cpu size={17} color="#8b5cf6" />
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700 }}>Edge Hardware</h1>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            Simulated edge compute nodes on each bus
          </p>
        </div>
        <span className="sim-tag" style={{ marginLeft: 12 }}>ALL HARDWARE IS SIMULATED</span>

        {/* Bandwidth comparison */}
        <div style={{
          marginLeft: 'auto',
          background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 8, padding: '8px 14px', fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Zap size={14} color="#22c55e" />
          <div>
            <div style={{ fontWeight: 600, color: '#22c55e' }}>Edge AI Saves ~87% Bandwidth</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Only metadata & events sent to cloud · Simulated estimate</div>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Architecture diagram */}
        <div className="card" style={{ marginBottom: 16, background: 'var(--color-surface-2)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Edge-First Architecture Pipeline</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { label: 'Optical Cameras', desc: '4K HDR 30FPS' },
              { label: 'Edge AI NPU', desc: 'YOLO · ByteTrack' },
              { label: 'Event Extraction', desc: 'Verified Alerts Only' },
              { label: 'Telemetry Mesh', desc: '90% Bandwidth Saved' },
              { label: 'Command Hub', desc: 'FastAPI + Database' },
              { label: 'GIS Mapping', desc: 'Spatial GeoJSON' },
              { label: 'Urban Analytics', desc: 'Department Reports' },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  background: 'var(--color-surface-3)', border: '1px solid var(--color-border-2)',
                  borderRadius: 8, padding: '10px 14px', textAlign: 'center', minWidth: 110,
                }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{item.desc}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ padding: '0 8px', color: '#38bdf8', fontWeight: 700 }}>→</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
            High-efficiency on-bus processing architecture for municipal transport networks
          </div>
        </div>

        {/* Node cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>Loading edge nodes...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
            {nodes.map(node => <EdgeNodeCard key={node.bus_id} node={node} />)}
          </div>
        )}
      </div>
    </div>
  );
}
