import { useEffect, useState } from 'react';
import { Upload, Video, CheckCircle, AlertCircle, Clock, Cpu, FileVideo } from 'lucide-react';
import { uploadVideo, getVideoJobs } from '../services/api';
import type { VideoJob, Detection } from '../types';

const CLASS_COLORS: Record<string, string> = {
  car: '#3b82f6', motorcycle: '#22c55e', truck: '#f97316', bus: '#8b5cf6',
  pedestrian: '#f59e0b', bicycle: '#06b6d4', pothole: '#ef4444',
  waterlogging: '#3b82f6', traffic_sign: '#f59e0b', road_hazard: '#dc2626',
};

function JobCard({ job, selected, onSelect }: { job: VideoJob; selected: boolean; onSelect: () => void }) {
  const statusIcon = job.status === 'COMPLETED' ? <CheckCircle size={14} color="#22c55e" /> :
    job.status === 'PROCESSING' ? <Cpu size={14} color="#f59e0b" /> :
    job.status === 'FAILED' ? <AlertCircle size={14} color="#ef4444" /> :
    <Clock size={14} color="#6b7280" />;

  return (
    <div className="card-sm" style={{ cursor: 'pointer', border: selected ? '1px solid #3b82f6' : undefined }}
      onClick={onSelect}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {statusIcon}
        <span style={{ fontWeight: 600, fontSize: 13 }}>{job.filename}</span>
        <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{job.bus_id}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>
        Job: {job.id} · Status: {job.status}
      </div>
      {job.status === 'PROCESSING' && (
        <div className="progress-bar" style={{ marginBottom: 4 }}>
          <div className="progress-fill" style={{ width: `${job.progress}%`, background: '#f59e0b' }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--color-text-secondary)' }}>
        <span>Frames: {job.total_frames}</span>
        <span>Detections: {job.detections_count}</span>
        <span>Events: {job.events_generated}</span>
      </div>
    </div>
  );
}

export function AIVideoAnalytics() {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<VideoJob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [busId, setBusId] = useState('BUS-001');
  const [dragOver, setDragOver] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);

  const loadJobs = async () => {
    const data = await getVideoJobs();
    setJobs(data.jobs);
    if (selectedJob) {
      const updated = data.jobs.find(j => j.id === selectedJob.id);
      if (updated) setSelectedJob(updated);
    }
  };

  useEffect(() => { loadJobs(); const t = setInterval(loadJobs, 3000); return () => clearInterval(t); }, []);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadVideo(file, busId);
      await loadJobs();
    } catch (e) {
      alert('Upload failed');
    }
    setUploading(false);
  };

  const frameDetections = selectedJob?.detections?.filter(d => d.frame === (selectedJob.detections![frameIdx]?.frame)) || [];

  const classCounts: Record<string, number> = {};
  selectedJob?.detections?.forEach(d => { classCounts[d.class] = (classCounts[d.class] || 0) + 1; });

  return (
    <div>
      <div className="page-header">
        <Video size={17} color="#8b5cf6" />
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700 }}>AI Video Analytics</h1>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Upload video for simulated AI analysis</p>
        </div>
        <span className="sim-tag" style={{ marginLeft: 12 }}>SIMULATED AI DETECTION</span>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
          {/* Left panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Upload */}
            <div className="card">
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Upload Road Video</h3>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Assign to Bus</label>
                <select value={busId} onChange={e => setBusId(e.target.value)}
                  style={{ display: 'block', width: '100%', marginTop: 4, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 4, padding: '5px 8px', fontSize: 12 }}>
                  {['BUS-001', 'BUS-002', 'BUS-003', 'BUS-004', 'BUS-005'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div
                style={{
                  border: `2px dashed ${dragOver ? '#3b82f6' : 'var(--color-border-2)'}`,
                  borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? 'rgba(59,130,246,0.05)' : undefined,
                  transition: 'all 0.15s',
                }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => document.getElementById('video-input')?.click()}
              >
                <FileVideo size={28} color={dragOver ? '#3b82f6' : '#4a5a7a'} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Drop MP4/WebM here or click to browse
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  AI runs in simulation mode
                </div>
              </div>
              <input id="video-input" type="file" accept="video/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {uploading && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4 }}>Uploading...</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '100%', background: '#f59e0b', animation: 'progress-indeterminate 1s infinite' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Job list */}
            <div className="card">
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Processing Jobs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
                {jobs.map(job => (
                  <JobCard key={job.id} job={job} selected={selectedJob?.id === job.id}
                    onSelect={() => setSelectedJob(job)} />
                ))}
                {jobs.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 12, padding: 16 }}>
                    No jobs yet — upload a video
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selectedJob ? (
              <>
                {/* Job detail */}
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600 }}>{selectedJob.filename}</h3>
                    <span className={`badge ${selectedJob.status === 'COMPLETED' ? 'badge-green' : selectedJob.status === 'PROCESSING' ? 'badge-amber' : 'badge-gray'}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  {selectedJob.status === 'PROCESSING' && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Processing frames...</span>
                        <span style={{ color: '#f59e0b' }}>{selectedJob.progress}%</span>
                      </div>
                      <div className="progress-bar" style={{ height: 6 }}>
                        <div className="progress-fill" style={{ width: `${selectedJob.progress}%`, background: '#f59e0b' }} />
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Total Frames', value: selectedJob.total_frames },
                      { label: 'Detections', value: selectedJob.detections_count },
                      { label: 'Events Generated', value: selectedJob.events_generated },
                      { label: 'Progress', value: `${selectedJob.progress}%` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: 'center', padding: 8, background: 'var(--color-surface-2)', borderRadius: 6 }}>
                        <div className="metric-label">{label}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detection classes */}
                {Object.keys(classCounts).length > 0 && (
                  <div className="card">
                    <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Detection Summary</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {Object.entries(classCounts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cls, count]) => (
                          <div key={cls} style={{
                            padding: '4px 12px', borderRadius: 20,
                            background: `${CLASS_COLORS[cls] || '#3b82f6'}18`,
                            border: `1px solid ${CLASS_COLORS[cls] || '#3b82f6'}30`,
                            fontSize: 12, fontWeight: 500,
                            color: CLASS_COLORS[cls] || '#3b82f6',
                          }}>
                            {cls}: {count}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Detection timeline */}
                {selectedJob.detections && selectedJob.detections.length > 0 && (
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 600 }}>Detection Timeline (Simulated)</h3>
                      <span className="sim-tag">SIMULATED AI DETECTION</span>
                    </div>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {selectedJob.detections.slice(0, 50).map((det, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '5px 0', borderBottom: '1px solid var(--color-border)',
                          fontSize: 12,
                        }}>
                          <span style={{ color: 'var(--color-text-muted)', width: 55, flexShrink: 0 }}>{det.timestamp_sec.toFixed(1)}s</span>
                          <span style={{
                            padding: '1px 8px', borderRadius: 10, fontWeight: 600,
                            background: `${CLASS_COLORS[det.class] || '#3b82f6'}15`,
                            color: CLASS_COLORS[det.class] || '#3b82f6',
                            fontSize: 11,
                          }}>{det.class}</span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Conf: {(det.confidence * 100).toFixed(0)}%</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>Track #{det.track_id}</span>
                          {det.is_road_event && <span className="badge badge-red">Road Event</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: 64 }}>
                <Video size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Upload a video to start AI analysis</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
                  The AI simulation adapter will generate realistic detections for vehicles, road defects, and pedestrians.
                </div>
                <div className="sim-tag" style={{ display: 'inline-block', marginTop: 12 }}>SIMULATED AI DETECTION — YOLO-compatible stub</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
