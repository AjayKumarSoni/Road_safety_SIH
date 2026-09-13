import { useEffect, useState, useRef } from 'react';
import {
  Bus as BusIcon, AlertTriangle, Send, CheckCircle2, Download,
  MapPin, Clock, ArrowUpRight, ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import { getBuses } from '../services/api';
import { useStore } from '../store/useStore';
import type { Bus } from '../types';

// Human-friendly scenario profile per bus
const BUS_SCENARIOS: Record<string, {
  name: string;
  badgeColor: string;
  primaryDefect: string;
  location: string;
  speed: number;
  anprPlate: string;
  anprVehicle: string;
  department: string;
  actionText: string;
}> = {
  'BUS-001': {
    name: 'Road Potholes & Cracks',
    badgeColor: '#dc2626',
    primaryDefect: 'Deep Road Pothole (12 cm depth)',
    location: 'Station Road Market Corridor',
    speed: 36,
    anprPlate: 'CG 04 TA 4421',
    anprVehicle: 'Auto-Rickshaw',
    department: 'Public Works Dept (PWD)',
    actionText: 'Dispatch PWD Asphalt Crew',
  },
  'BUS-002': {
    name: 'Speeding & Traffic Patrol',
    badgeColor: '#ef4444',
    primaryDefect: 'Speeding Vehicle (84 km/h in 50 zone)',
    location: 'Ring Road No. 1 Expressway',
    speed: 58,
    anprPlate: 'CG 04 AB 1234',
    anprVehicle: 'White Sedan',
    department: 'Traffic Police HQ',
    actionText: 'Send Alert to Traffic Police',
  },
  'BUS-003': {
    name: 'Street Waterlogging',
    badgeColor: '#0284c7',
    primaryDefect: 'Waterlogged Underpass (18 cm water)',
    location: 'Pachpedi Naka Underpass',
    speed: 18,
    anprPlate: 'CG 04 M 9912',
    anprVehicle: 'Commercial Truck',
    department: 'Municipal Drainage & Sanitation',
    actionText: 'Send Municipal Drainage Team',
  },
  'BUS-004': {
    name: 'Broken Dividers & Signs',
    badgeColor: '#d97706',
    primaryDefect: 'Damaged Speed Limit Sign & Divider Gap',
    location: 'VIP Road Airport Corridor',
    speed: 62,
    anprPlate: 'CG 04 H 5502',
    anprVehicle: 'Black SUV',
    department: 'Public Works Dept (PWD)',
    actionText: 'Schedule Divider Repair',
  },
  'BUS-005': {
    name: 'Pedestrian & School Safety',
    badgeColor: '#7c3aed',
    primaryDefect: 'Faded School Crosswalk & Pedestrian Risk',
    location: 'Civil Lines School Zone',
    speed: 25,
    anprPlate: 'CG 04 B 8890',
    anprVehicle: 'Yellow Transit Van',
    department: 'Traffic Safety Cell',
    actionText: 'Request Road Repainting',
  },
};

// Initial realistic detection history per bus
interface DetectionRecord {
  id: string;
  time: string;
  type: string;
  location: string;
  depth: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  lat: number;
  lng: number;
  status: 'Sent to PWD' | 'Logged' | 'Repaired';
}

const INITIAL_HISTORY: Record<string, DetectionRecord[]> = {
  'BUS-001': [
    { id: 'REC-101', time: '12:01 PM', type: 'Deep Crater Pothole', location: 'Station Road Market', depth: '12 cm', severity: 'CRITICAL', lat: 21.2542, lng: 81.6322, status: 'Sent to PWD' },
    { id: 'REC-102', time: '11:48 AM', type: 'Asphalt Surface Crack', location: 'Station Road (Near Gurudwara)', depth: '6 cm', severity: 'MEDIUM', lat: 21.2531, lng: 81.6310, status: 'Logged' },
    { id: 'REC-103', time: '11:22 AM', type: 'Severe Pothole Cluster', location: 'Fafadih Chowk', depth: '15 cm', severity: 'CRITICAL', lat: 21.2580, lng: 81.6380, status: 'Sent to PWD' },
    { id: 'REC-104', time: '10:55 AM', type: 'Sunken Manhole Cover', location: 'Telibandha Main Road', depth: '9 cm', severity: 'HIGH', lat: 21.2410, lng: 81.6620, status: 'Logged' },
  ],
  'BUS-002': [
    { id: 'REC-201', time: '12:03 PM', type: 'High-Speed Reckless Driving', location: 'Ring Road Expressway', depth: '84 km/h', severity: 'CRITICAL', lat: 21.2420, lng: 81.6500, status: 'Sent to PWD' },
    { id: 'REC-202', time: '11:35 AM', type: 'Pothole on Left Lane', location: 'Bhatagaon Flyover', depth: '8 cm', severity: 'HIGH', lat: 21.2190, lng: 81.6350, status: 'Logged' },
    { id: 'REC-203', time: '10:40 AM', type: 'Debris in Middle Lane', location: 'Sarona Crossing', depth: 'Obstacle', severity: 'MEDIUM', lat: 21.2480, lng: 81.5950, status: 'Logged' },
  ],
  'BUS-003': [
    { id: 'REC-301', time: '12:02 PM', type: 'Street Submersion Waterlogging', location: 'Pachpedi Naka Underpass', depth: '18 cm', severity: 'CRITICAL', lat: 21.2280, lng: 81.6440, status: 'Sent to PWD' },
    { id: 'REC-302', time: '11:15 AM', type: 'Blocked Stormwater Drain', location: 'Santoshi Nagar Road', depth: 'Drain Clog', severity: 'HIGH', lat: 21.2210, lng: 81.6410, status: 'Logged' },
    { id: 'REC-303', time: '10:30 AM', type: 'Water Puddle Over Pothole', location: 'Dhamtari Road Entrance', depth: '11 cm', severity: 'HIGH', lat: 21.2150, lng: 81.6480, status: 'Logged' },
  ],
  'BUS-004': [
    { id: 'REC-401', time: '12:00 PM', type: 'Damaged Signboard (Tilted 45°)', location: 'VIP Road Airport Highway', depth: 'Tilted Sign', severity: 'MEDIUM', lat: 21.2180, lng: 81.6850, status: 'Logged' },
    { id: 'REC-402', time: '11:20 AM', type: 'Broken Median Road Divider', location: 'Energy Park Junction', depth: 'Gap: 4 meters', severity: 'HIGH', lat: 21.2250, lng: 81.6780, status: 'Sent to PWD' },
  ],
  'BUS-005': [
    { id: 'REC-501', time: '12:01 PM', type: 'Faded School Zebra Crossing', location: 'Civil Lines School Zone', depth: 'Faded Markings', severity: 'HIGH', lat: 21.2410, lng: 81.6360, status: 'Sent to PWD' },
    { id: 'REC-502', time: '11:10 AM', type: 'Pothole Near Bus Stop', location: 'Raj Bhavan Road', depth: '7 cm', severity: 'MEDIUM', lat: 21.2440, lng: 81.6390, status: 'Logged' },
  ],
};

export function LiveFleet() {
  const { buses, setBuses } = useStore();
  const [selectedBusId, setSelectedBusId] = useState<string>('BUS-001');
  const [activeCam, setActiveCam] = useState<'front' | 'anpr' | 'side'>('front');
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [busHistory, setBusHistory] = useState<Record<string, DetectionRecord[]>>(INITIAL_HISTORY);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBuses();
        setBuses(data.buses);
      } catch (e) {
        // quiet fallback
      }
    };
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  const selectedBus = buses.find((b) => b.id === selectedBusId) || buses[0];
  const busProfile = BUS_SCENARIOS[selectedBusId] || BUS_SCENARIOS['BUS-001'];
  const currentHistory = busHistory[selectedBusId] || [];

  // ─────────────────────────────────────────────────────────────
  // MULTI-BUS & 3-CAMERA MODE PERSPECTIVE SIMULATION ENGINE
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let progress = 0;
    let lastPotholeLoggedTime = 0;

    // Bus-specific objects
    const potholes = [
      { z: 0.88, laneOffset: -0.32, size: 28, depth: 12, label: 'POTHOLE (12cm depth)' },
      { z: 0.42, laneOffset: 0.38, size: 20, depth: 7, label: 'ASPHALT CRACK' },
      { z: 0.12, laneOffset: -0.15, size: 34, depth: 15, label: 'DEEP CRATER (15cm)' },
    ];

    const oncomingCar = {
      z: 0.78,
      laneOffset: selectedBusId === 'BUS-002' ? 0.35 : 0.52,
      plate: busProfile.anprPlate,
      type: busProfile.anprVehicle,
      speed: selectedBusId === 'BUS-002' ? 84 : selectedBusId === 'BUS-001' ? 32 : 45,
    };

    const render = (timestamp: number) => {
      progress += 0.008;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // =========================================================================
      // CAMERA MODE 1: NUMBER PLATE ZOOM (ANPR TELEPHOTO OPTICAL SCANNER)
      // =========================================================================
      if (activeCam === 'anpr') {
        // Dark road background with bokeh lights
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        // Telephoto road blur bokeh
        for (let b = 0; b < 12; b++) {
          const bx = ((b * 95 + progress * 80) % w);
          const by = 80 + (b * 27) % (h - 160);
          ctx.fillStyle = b % 2 === 0 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(250, 204, 21, 0.15)';
          ctx.beginPath();
          ctx.arc(bx, by, 24 + (b % 4) * 8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Preceding Vehicle Rear Bumper (Optical Zoom Close-up)
        const carBodyY = h * 0.52;
        const carBodyW = w * 0.68;
        const carBodyH = h * 0.48;
        const carBodyX = (w - carBodyW) / 2;

        // Vehicle bumper gradient
        const bumperGrad = ctx.createLinearGradient(0, carBodyY - 80, 0, h);
        if (selectedBusId === 'BUS-002') {
          // White sedan
          bumperGrad.addColorStop(0, '#f8fafc');
          bumperGrad.addColorStop(0.5, '#cbd5e1');
          bumperGrad.addColorStop(1, '#94a3b8');
        } else if (selectedBusId === 'BUS-001') {
          // Commercial Auto
          bumperGrad.addColorStop(0, '#15803d');
          bumperGrad.addColorStop(0.6, '#0f172a');
          bumperGrad.addColorStop(1, '#020617');
        } else if (selectedBusId === 'BUS-003') {
          // Commercial Truck
          bumperGrad.addColorStop(0, '#1e3a8a');
          bumperGrad.addColorStop(0.6, '#172554');
          bumperGrad.addColorStop(1, '#0f172a');
        } else {
          // Urban Vehicle
          bumperGrad.addColorStop(0, '#475569');
          bumperGrad.addColorStop(0.6, '#334155');
          bumperGrad.addColorStop(1, '#0f172a');
        }

        ctx.fillStyle = bumperGrad;
        ctx.beginPath();
        ctx.roundRect(carBodyX, carBodyY - 90, carBodyW, carBodyH + 90, 16);
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Left & Right glowing taillights
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 24;
        ctx.fillRect(carBodyX + 24, carBodyY - 60, 60, 28);
        ctx.fillRect(carBodyX + carBodyW - 84, carBodyY - 60, 60, 28);
        ctx.shadowBlur = 0;

        // Number Plate Cavity (Recessed Dark Bay)
        const plateW = 420;
        const plateH = 110;
        const plateX = (w - plateW) / 2;
        const plateY = carBodyY - 20;

        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.roundRect(plateX - 10, plateY - 10, plateW + 20, plateH + 20, 8);
        ctx.fill();

        // HIGH SECURITY REGISTRATION PLATE (HSRP)
        // White for private / Yellow for commercial
        const isCommercial = ['BUS-001', 'BUS-003'].includes(selectedBusId);
        ctx.fillStyle = isCommercial ? '#fbbf24' : '#ffffff';
        ctx.beginPath();
        ctx.roundRect(plateX, plateY, plateW, plateH, 6);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Blue 'IND' Strip with hologram
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.roundRect(plateX, plateY, 44, plateH, [6, 0, 0, 6]);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(plateX + 22, plateY + 30, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('IND', plateX + 22, plateY + 65);

        // Embossed Plate Characters
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 38px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(busProfile.anprPlate, plateX + (plateW + 44) / 2, plateY + 68);

        // Laser scan sweep line across plate
        const scanY = plateY + ((Math.sin(progress * 6) + 1) / 2) * plateH;
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(plateX, scanY);
        ctx.lineTo(plateX + plateW, scanY);
        ctx.stroke();

        // High-Tech Targeting Reticle Brackets
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        const bracketMargin = 22;
        const bLeft = plateX - bracketMargin;
        const bTop = plateY - bracketMargin;
        const bRight = plateX + plateW + bracketMargin;
        const bBottom = plateY + plateH + bracketMargin;
        const tick = 24;

        // Top Left Bracket
        ctx.beginPath();
        ctx.moveTo(bLeft, bTop + tick);
        ctx.lineTo(bLeft, bTop);
        ctx.lineTo(bLeft + tick, bTop);
        // Top Right Bracket
        ctx.moveTo(bRight - tick, bTop);
        ctx.lineTo(bRight, bTop);
        ctx.lineTo(bRight, bTop + tick);
        // Bottom Left Bracket
        ctx.moveTo(bLeft, bBottom - tick);
        ctx.lineTo(bLeft, bBottom);
        ctx.lineTo(bLeft + tick, bBottom);
        // Bottom Right Bracket
        ctx.moveTo(bRight - tick, bBottom);
        ctx.lineTo(bRight, bBottom);
        ctx.lineTo(bRight, bBottom - tick);
        ctx.stroke();

        // Center Crosshair
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 20, plateY + plateH / 2);
        ctx.lineTo(w / 2 + 20, plateY + plateH / 2);
        ctx.moveTo(w / 2, plateY + plateH / 2 - 20);
        ctx.lineTo(w / 2, plateY + plateH / 2 + 20);
        ctx.stroke();

        // ANPR Information Card Overlay
        const cardW = 560;
        const cardH = 80;
        const cardX = (w - cardW) / 2;
        const cardY = h - 100;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 8);
        ctx.fill();
        ctx.strokeStyle = selectedBusId === 'BUS-002' ? '#dc2626' : '#2563eb';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`ANPR VEHICLE ID: ${busProfile.anprVehicle.toUpperCase()} · ${busProfile.anprPlate}`, cardX + 16, cardY + 26);

        if (selectedBusId === 'BUS-002') {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 13px Inter, sans-serif';
          ctx.fillText(`● SPEED VIOLATION: 84 KM/H [LIMIT 50 KM/H] · E-CHALLAN ISSUED`, cardX + 16, cardY + 54);
        } else {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 12.5px Inter, sans-serif';
          ctx.fillText(`● STATUS: VERIFIED OK · VAHAN DATABASE RECORD CONFIRMED`, cardX + 16, cardY + 54);
        }

        ctx.textAlign = 'right';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11.5px JetBrains Mono, monospace';
        ctx.fillText(`OCR CONFIDENCE: 99.4%`, cardX + cardW - 16, cardY + 26);
        ctx.fillText(`LATENCY: 12ms`, cardX + cardW - 16, cardY + 54);

        // Top HUD Header
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, w, 34);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`● TELEPHOTO OPTICAL ZOOM 4.5x [ANPR OCR] · ${selectedBusId} · ${busProfile.location.toUpperCase()}`, 18, 22);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#22c55e';
        ctx.fillText(`LENS: 85mm F/2.8 · 1080P 60FPS · HD OPTICAL`, w - 18, 22);

      // =========================================================================
      // CAMERA MODE 2: CURB & SHOULDER SCANNER (DOWNWARD DIAGONAL SENSOR)
      // =========================================================================
      } else if (activeCam === 'side') {
        // Road Tarmac (Left 58%)
        const curbStartX = w * 0.54;
        const curbWidth = 65;

        // Asphalt Gradient
        const asphaltGrad = ctx.createLinearGradient(0, 0, curbStartX, 0);
        asphaltGrad.addColorStop(0, '#0f172a');
        asphaltGrad.addColorStop(0.8, '#1e293b');
        asphaltGrad.addColorStop(1, '#334155');
        ctx.fillStyle = asphaltGrad;
        ctx.fillRect(0, 0, curbStartX, h);

        // Moving Asphalt Texture Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 2;
        const textureOffset = (progress * 260) % 60;
        for (let y = -60; y < h + 60; y += 50) {
          ctx.beginPath();
          ctx.moveTo(w * 0.1, y + textureOffset);
          ctx.lineTo(w * 0.18, y + textureOffset + 15);
          ctx.stroke();
        }

        // Concrete Curb Stone (Border)
        const curbGrad = ctx.createLinearGradient(curbStartX, 0, curbStartX + curbWidth, 0);
        curbGrad.addColorStop(0, '#cbd5e1');
        curbGrad.addColorStop(0.5, '#e2e8f0');
        curbGrad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = curbGrad;
        ctx.fillRect(curbStartX, 0, curbWidth, h);

        // Curb Stone Segment Lines (Moving with bus speed)
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        const curbSegmentSpeed = (progress * 300) % 90;
        for (let cy = -90; cy < h + 90; cy += 90) {
          ctx.beginPath();
          ctx.moveTo(curbStartX, cy + curbSegmentSpeed);
          ctx.lineTo(curbStartX + curbWidth, cy + curbSegmentSpeed);
          ctx.stroke();
        }

        // Sidewalk / Pedestrian Pavement (Right 38%)
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(curbStartX + curbWidth, 0, w - (curbStartX + curbWidth), h);

        // Pavement Tile Grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        const tileSpeed = (progress * 300) % 60;
        for (let ty = -60; ty < h + 60; ty += 60) {
          ctx.beginPath();
          ctx.moveTo(curbStartX + curbWidth, ty + tileSpeed);
          ctx.lineTo(w, ty + tileSpeed);
          ctx.stroke();
        }
        for (let tx = curbStartX + curbWidth + 60; tx < w; tx += 60) {
          ctx.beginPath();
          ctx.moveTo(tx, 0);
          ctx.lineTo(tx, h);
          ctx.stroke();
        }

        // Stormwater Drain Grating passing down the gutter
        const drainY = ((progress * 180) % (h + 120)) - 60;
        if (drainY > -40 && drainY < h + 40) {
          const drainX = curbStartX - 48;
          const drainW = 44;
          const drainH = 80;

          ctx.fillStyle = '#020617';
          ctx.fillRect(drainX, drainY, drainW, drainH);

          // Drain iron bars
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2.5;
          for (let by = drainY + 8; by < drainY + drainH; by += 10) {
            ctx.beginPath();
            ctx.moveTo(drainX + 3, by);
            ctx.lineTo(drainX + drainW - 3, by);
            ctx.stroke();
          }

          // Drain AI Inspection Bounding Box
          const isBlocked = selectedBusId === 'BUS-003';
          ctx.strokeStyle = isBlocked ? '#dc2626' : '#10b981';
          ctx.lineWidth = 2;
          ctx.strokeRect(drainX - 8, drainY - 8, drainW + 16, drainH + 16);

          ctx.fillStyle = isBlocked ? 'rgba(220, 38, 38, 0.95)' : 'rgba(16, 185, 129, 0.95)';
          ctx.fillRect(drainX - 8, drainY - 32, 230, 22);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(
            isBlocked ? 'STORM DRAIN: BLOCKED 45% · SILT' : 'STORM DRAIN: 94% FLOW CLEAR',
            drainX - 2,
            drainY - 17
          );
        }

        // Cyan Curb Alignment Laser Tracing Line
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(curbStartX - 4, 0);
        ctx.lineTo(curbStartX - 4, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Laser Distance Measurement Tick Rulers
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        for (let r = 80; r < h; r += 90) {
          ctx.fillText(`${(r / 100).toFixed(1)}m`, curbStartX - 12, r);
          ctx.fillRect(curbStartX - 10, r - 3, 6, 2);
        }

        // Telemetry Floating Readout Card
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.roundRect(24, h - 85, 380, 65, 8);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`CURB SENSOR ALIGNMENT: 38.4 CM (TOLERANCE ±2 CM)`, 38, h - 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = '11.5px Inter, sans-serif';
        ctx.fillText(`SIDEWALK ENCHROACHMENT: CLEAR · ROAD SHOULDER INTACT`, 38, h - 36);

        // Top HUD Header
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, w, 34);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(20, 17, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`DOWNWARD CURB & SHOULDER SCANNER · ${selectedBusId} · ${busProfile.location.toUpperCase()}`, 34, 22);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`LENS: 24mm F/2.0 · 2K QHD 30FPS · GROUND SENSOR`, w - 18, 22);

      // =========================================================================
      // CAMERA MODE 3: FRONT ROAD CAMERA (DISTINCT ROAD SCENE PER BUS)
      // =========================================================================
      } else {
        const horizonY = h * 0.42;

        // 1. SKY & HORIZON (Distinct per bus)
        const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
        if (selectedBusId === 'BUS-003') {
          // Overcast rainy monsoon sky for BUS-003
          skyGradient.addColorStop(0, '#1e293b');
          skyGradient.addColorStop(0.5, '#334155');
          skyGradient.addColorStop(1, '#475569');
        } else if (selectedBusId === 'BUS-002') {
          // Bright highway sky
          skyGradient.addColorStop(0, '#0284c7');
          skyGradient.addColorStop(0.6, '#38bdf8');
          skyGradient.addColorStop(1, '#bae6fd');
        } else {
          // Urban daylight
          skyGradient.addColorStop(0, '#38bdf8');
          skyGradient.addColorStop(0.5, '#7dd3fc');
          skyGradient.addColorStop(1, '#bae6fd');
        }
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, horizonY);

        // Horizon Skyline / Backdrop
        ctx.fillStyle = selectedBusId === 'BUS-003' ? '#334155' : '#94a3b8';
        const buildingWidths = [45, 60, 35, 70, 50, 80, 40, 65, 55, 90, 40, 75, 50, 60, 45, 80];
        let bX = 0;
        for (let i = 0; i < buildingWidths.length; i++) {
          const bw = buildingWidths[i];
          const bh = 25 + ((i * 17) % 45);
          ctx.fillRect(bX, horizonY - bh, bw, bh);
          bX += bw + 8;
        }

        // Roadside Terrain / Grass
        const terrainGrad = ctx.createLinearGradient(0, horizonY, 0, h);
        terrainGrad.addColorStop(0, selectedBusId === 'BUS-003' ? '#14532d' : '#15803d');
        terrainGrad.addColorStop(1, '#166534');
        ctx.fillStyle = terrainGrad;
        ctx.fillRect(0, horizonY, w, h - horizonY);

        // 2. PERSPECTIVE ASPHALT ROAD
        const roadTopWidth = w * 0.22;
        const roadBottomWidth = w * 0.92;
        const roadTopLeft = (w - roadTopWidth) / 2;
        const roadTopRight = roadTopLeft + roadTopWidth;
        const roadBottomLeft = (w - roadBottomWidth) / 2;
        const roadBottomRight = roadBottomLeft + roadBottomWidth;

        const roadGrad = ctx.createLinearGradient(0, horizonY, 0, h);
        if (selectedBusId === 'BUS-003') {
          // Wet reflective tarmac
          roadGrad.addColorStop(0, '#1e293b');
          roadGrad.addColorStop(0.5, '#0f172a');
          roadGrad.addColorStop(1, '#020617');
        } else {
          roadGrad.addColorStop(0, '#334155');
          roadGrad.addColorStop(0.4, '#1e293b');
          roadGrad.addColorStop(1, '#0f172a');
        }

        ctx.beginPath();
        ctx.moveTo(roadTopLeft, horizonY);
        ctx.lineTo(roadTopRight, horizonY);
        ctx.lineTo(roadBottomRight, h);
        ctx.lineTo(roadBottomLeft, h);
        ctx.closePath();
        ctx.fillStyle = roadGrad;
        ctx.fill();

        // Concrete Curbs on both edges
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(roadTopLeft, horizonY);
        ctx.lineTo(roadBottomLeft, h);
        ctx.moveTo(roadTopRight, horizonY);
        ctx.lineTo(roadBottomRight, h);
        ctx.stroke();

        // 3. PERSPECTIVE LANE MARKINGS
        const dashSpeed = (progress * 180) % 50;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([20, 25]);
        ctx.lineDashOffset = -dashSpeed;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, horizonY);
        ctx.lineTo(w * 0.5, h);
        ctx.stroke();

        // White Lane Dividers
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([15, 25]);
        ctx.beginPath();
        ctx.moveTo((roadTopLeft + w * 0.5) / 2, horizonY);
        ctx.lineTo((roadBottomLeft + w * 0.5) / 2, h);
        ctx.moveTo((roadTopRight + w * 0.5) / 2, horizonY);
        ctx.lineTo((roadBottomRight + w * 0.5) / 2, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4. ROAD-SIDE TREES / POLES
        for (let i = 0; i < 6; i++) {
          const pz = ((i * 0.18 + progress * 0.6) % 1);
          if (pz <= 0.05) continue;
          const scale = pz;
          const poleY = horizonY + (h - horizonY) * pz;
          const leftX = roadBottomLeft + (roadTopLeft - roadBottomLeft) * (1 - pz) - 35 * scale;
          const rightX = roadBottomRight + (roadTopRight - roadBottomRight) * (1 - pz) + 35 * scale;

          ctx.fillStyle = '#047857';
          ctx.beginPath();
          ctx.arc(leftX, poleY - 24 * scale, 18 * scale, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2 * scale;
          ctx.beginPath();
          ctx.moveTo(rightX, poleY);
          ctx.lineTo(rightX, poleY - 45 * scale);
          ctx.lineTo(rightX - 12 * scale, poleY - 45 * scale);
          ctx.stroke();
        }

        // =========================================================================
        // SCENE SPECIFIC 1: BUS-003 MONSOON RAIN & WATERLOGGING POOL
        // =========================================================================
        if (selectedBusId === 'BUS-003') {
          // Falling Rain Streaks
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
          ctx.lineWidth = 1.5;
          for (let r = 0; r < 45; r++) {
            const rx = (r * 31 + progress * 900) % w;
            const ry = (r * 47 + progress * 1400) % h;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 8, ry + 18);
            ctx.stroke();
          }

          // Large Reflective Waterlogging Pool on Road
          const poolZ = 0.65;
          const poolY = horizonY + (h - horizonY) * poolZ;
          const poolW = (roadTopWidth + (roadBottomWidth - roadTopWidth) * poolZ) * 0.6;
          const poolX = w * 0.48;

          ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
          ctx.beginPath();
          ctx.ellipse(poolX, poolY, poolW / 2, 28, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Waterlogging Bounding Box
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(poolX - poolW / 2 - 10, poolY - 32, poolW + 20, 64);

          ctx.fillStyle = 'rgba(2, 132, 199, 0.95)';
          ctx.fillRect(poolX - poolW / 2 - 10, poolY - 56, 280, 22);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`WATERLOGGING HAZARD (18 cm depth) · UNDERPASS`, poolX - poolW / 2 - 4, poolY - 40);
        }

        // =========================================================================
        // SCENE SPECIFIC 2: BUS-005 CIVIL LINES SCHOOL ZONE CROSSWALK
        // =========================================================================
        if (selectedBusId === 'BUS-005') {
          const crossZ = ((0.5 + progress * 0.4) % 1);
          if (crossZ > 0.15 && crossZ < 0.9) {
            const cY = horizonY + (h - horizonY) * crossZ;
            const cRoadW = roadTopWidth + (roadBottomWidth - roadTopWidth) * crossZ;
            const cLeft = (w - cRoadW) / 2 + 10;
            const cRight = (w + cRoadW) / 2 - 10;

            // Zebra crossing stripes
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            const stripeCount = 10;
            const stripeW = (cRight - cLeft) / (stripeCount * 2);
            for (let s = 0; s < stripeCount; s++) {
              ctx.fillRect(cLeft + s * stripeW * 2, cY - 14 * crossZ, stripeW, 28 * crossZ);
            }

            // Pedestrian Warning Box
            if (crossZ > 0.45 && crossZ < 0.75) {
              ctx.strokeStyle = '#7c3aed';
              ctx.lineWidth = 2.5;
              ctx.strokeRect(cLeft + 40, cY - 40, 320, 80);

              ctx.fillStyle = 'rgba(124, 58, 237, 0.95)';
              ctx.fillRect(cLeft + 40, cY - 64, 320, 22);
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 11px Inter, sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText(`PEDESTRIAN CROSSWALK · SCHOOL ZONE (20 KM/H)`, cLeft + 46, cY - 48);
            }
          }
        }

        // =========================================================================
        // SCENE SPECIFIC 3: BUS-004 BROKEN MEDIAN DIVIDER
        // =========================================================================
        if (selectedBusId === 'BUS-004') {
          const divZ = ((0.6 + progress * 0.4) % 1);
          if (divZ > 0.2 && divZ < 0.85) {
            const dY = horizonY + (h - horizonY) * divZ;
            const dRoadW = roadTopWidth + (roadBottomWidth - roadTopWidth) * divZ;
            const dX = (w - dRoadW) / 2 + 15;

            // Broken divider block
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(dX - 25, dY - 12, 35, 24);

            // Bounding Box
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(dX - 32, dY - 20, 180, 50);

            ctx.fillStyle = 'rgba(217, 119, 6, 0.95)';
            ctx.fillRect(dX - 32, dY - 42, 240, 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10.5px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`BROKEN ROAD DIVIDER (4m GAP) · PWD`, dX - 26, dY - 28);
          }
        }

        // 5. MOVING TRAFFIC VEHICLE AHEAD
        oncomingCar.z = ((oncomingCar.z - (selectedBusId === 'BUS-002' ? 0.005 : 0.0035) + 1) % 1);
        if (oncomingCar.z > 0.1) {
          const carZ = oncomingCar.z;
          const carY = horizonY + (h - horizonY) * (1 - carZ);
          const roadWAtZ = roadTopWidth + (roadBottomWidth - roadTopWidth) * (1 - carZ);
          const carX = (w * 0.5) + (roadWAtZ * (selectedBusId === 'BUS-002' ? 0.35 : 0.28));
          const carWidth = 90 * (1 - carZ);
          const carHeight = 55 * (1 - carZ);

          if (carWidth > 8) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(carX, carY + carHeight * 0.4, carWidth * 0.55, carHeight * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.fillStyle = selectedBusId === 'BUS-001' ? '#15803d' : '#ffffff';
            ctx.beginPath();
            ctx.roundRect(carX - carWidth / 2, carY - carHeight / 2, carWidth, carHeight * 0.7, 5);
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Rear windshield
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(carX - carWidth * 0.38, carY - carHeight * 0.45, carWidth * 0.76, carHeight * 0.35);

            // Taillights
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
            ctx.fillRect(carX - carWidth * 0.46, carY, carWidth * 0.18, carHeight * 0.18);
            ctx.fillRect(carX + carWidth * 0.28, carY, carWidth * 0.18, carHeight * 0.18);
            ctx.shadowBlur = 0;

            // Plate
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(carX - carWidth * 0.22, carY + carHeight * 0.05, carWidth * 0.44, carHeight * 0.16);

            // AI Bounding Box (Red Alert for Speeding on BUS-002)
            const isSpeeding = selectedBusId === 'BUS-002';
            ctx.strokeStyle = isSpeeding ? '#dc2626' : '#38bdf8';
            ctx.lineWidth = isSpeeding ? 2.5 : 2;
            ctx.strokeRect(carX - carWidth * 0.55, carY - carHeight * 0.55, carWidth * 1.1, carHeight * 1.1);

            ctx.fillStyle = isSpeeding ? 'rgba(220, 38, 38, 0.95)' : 'rgba(56, 189, 248, 0.9)';
            ctx.fillRect(carX - carWidth * 0.55, carY - carHeight * 0.55 - 18, carWidth * 1.1, 18);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9.5px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              isSpeeding ? `SPEED: 84 KM/H [LIMIT 50] · ${busProfile.anprPlate}` : `${busProfile.anprVehicle.toUpperCase()} · ${busProfile.anprPlate}`,
              carX,
              carY - carHeight * 0.55 - 5
            );
          }
        }

        // 6. ROAD POTHOLES (Prominent on BUS-001 & Regular roads)
        if (selectedBusId !== 'BUS-003') {
          potholes.forEach((pot) => {
            pot.z = ((pot.z - 0.005 + 1) % 1);
            if (pot.z > 0.05 && pot.z < 0.95) {
              const depthProgress = 1 - pot.z;
              const pY = horizonY + (h - horizonY) * depthProgress;
              const roadWAtY = roadTopWidth + (roadBottomWidth - roadTopWidth) * depthProgress;
              const pX = (w * 0.5) + (roadWAtY * pot.laneOffset * 0.45);
              const radX = (pot.size * depthProgress * 1.4);
              const radY = (pot.size * depthProgress * 0.55);

              if (radX > 4) {
                // Pothole Rim
                ctx.fillStyle = '#090d16';
                ctx.beginPath();
                ctx.ellipse(pX, pY, radX + 4, radY + 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Crater Depth
                const craterGrad = ctx.createRadialGradient(pX - radX * 0.2, pY - radY * 0.2, 2, pX, pY, radX);
                craterGrad.addColorStop(0, '#000000');
                craterGrad.addColorStop(0.7, '#090d16');
                craterGrad.addColorStop(1, '#1e293b');
                ctx.fillStyle = craterGrad;
                ctx.beginPath();
                ctx.ellipse(pX, pY, radX, radY, 0, 0, Math.PI * 2);
                ctx.fill();

                // Asphalt Cracks
                ctx.strokeStyle = '#020617';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(pX - radX, pY);
                ctx.lineTo(pX - radX - 8, pY + 4);
                ctx.moveTo(pX + radX, pY);
                ctx.lineTo(pX + radX + 10, pY - 3);
                ctx.moveTo(pX, pY + radY);
                ctx.lineTo(pX + 4, pY + radY + 6);
                ctx.stroke();

                // AI Detection Box on Pothole
                if (depthProgress > 0.45 && depthProgress < 0.88) {
                  const boxW = radX * 2.5;
                  const boxH = radY * 3.2;
                  const boxX = pX - boxW / 2;
                  const boxY = pY - boxH / 2;

                  ctx.strokeStyle = '#dc2626';
                  ctx.lineWidth = 2.5;
                  ctx.strokeRect(boxX, boxY, boxW, boxH);

                  ctx.fillStyle = 'rgba(220, 38, 38, 0.95)';
                  ctx.fillRect(boxX, boxY - 20, boxW, 20);
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 11px Inter, sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText(`POTHOLE (${pot.depth} cm depth)`, pX, boxY - 6);

                  // Auto-log into Bus History
                  const now = Date.now();
                  if (depthProgress > 0.65 && depthProgress < 0.70 && now - lastPotholeLoggedTime > 6000) {
                    lastPotholeLoggedTime = now;
                    const newRec: DetectionRecord = {
                      id: `REC-${Math.floor(100 + Math.random() * 900)}`,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      type: pot.depth > 12 ? 'Severe Crater Pothole' : 'Road Pothole',
                      location: busProfile.location,
                      depth: `${pot.depth} cm`,
                      severity: pot.depth > 12 ? 'CRITICAL' : 'HIGH',
                      lat: Number((selectedBus?.lat || 21.2514 + (Math.random() - 0.5) * 0.005).toFixed(5)),
                      lng: Number((selectedBus?.lng || 81.6296 + (Math.random() - 0.5) * 0.005).toFixed(5)),
                      status: 'Sent to PWD',
                    };
                    setBusHistory((prev) => ({
                      ...prev,
                      [selectedBusId]: [newRec, ...(prev[selectedBusId] || []).slice(0, 14)],
                    }));
                  }
                }
              }
            }
          });
        }

        // Top HUD Header
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, w, 34);

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(18, 17, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`FRONT OPTICAL CAM · ${selectedBusId} · ${busProfile.location.toUpperCase()}`, 32, 22);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`SPEED: ${busProfile.speed} KM/H  |  GPS: ${selectedBus?.lat?.toFixed(4) || '21.2514'}°N, ${selectedBus?.lng?.toFixed(4) || '81.6296'}°E`, w - 16, 22);

        // Bottom Status Badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(16, h - 38, 280, 26);
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`● ACTIVE SCANNING · 30 FPS · SENSORS OK`, 28, h - 21);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedBusId, activeCam, busProfile, selectedBus]);

  const handleAction = () => {
    setActionDone(`Work order created and dispatched to ${busProfile.department} for "${busProfile.primaryDefect}"`);
    setTimeout(() => setActionDone(null), 5000);
  };

  const exportHistoryCSV = () => {
    const headers = ['Record ID', 'Time', 'Hazard Type', 'Street Corridor', 'Depth / Size', 'Severity', 'Latitude', 'Longitude', 'Status'];
    const rows = currentHistory.map((h) => [
      h.id, h.time, h.type, h.location, h.depth, h.severity, h.lat, h.lng, h.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedBusId}_Pothole_History.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      {/* Clean Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#eff6ff', padding: 8, borderRadius: 8, border: '1px solid #bfdbfe' }}>
            <BusIcon size={20} color="#2563eb" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              Live Bus Cameras & Road Hazard Detection
            </h1>
            <p style={{ fontSize: 12.5, color: '#64748b' }}>
              Live front optical view from Raipur city buses with automatic pothole location logging
            </p>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 6,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            fontSize: 12,
            color: '#059669',
            fontWeight: 600,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
            5 Buses Streaming
          </span>
        </div>
      </div>

      <div className="page-content">
        {/* Toast Alert */}
        {actionDone && (
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
            <span>{actionDone}</span>
          </div>
        )}

        {/* Bus Selector Tabs */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
            Select Active Bus Camera Feed:
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {buses.map((bus) => {
              const isSelected = selectedBusId === bus.id;
              const p = BUS_SCENARIOS[bus.id] || BUS_SCENARIOS['BUS-001'];

              return (
                <button
                  key={bus.id}
                  onClick={() => setSelectedBusId(bus.id)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    color: isSelected ? '#1d4ed8' : '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 3,
                    boxShadow: isSelected ? '0 2px 4px rgba(37,99,235,0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{bus.id}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: isSelected ? '#2563eb' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#64748b',
                    }}>
                      {bus.route_name}
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, color: isSelected ? '#2563eb' : '#64748b', fontWeight: 500 }}>
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Camera Player Enclosure */}
        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
          {/* Stream Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                  {selectedBusId} — {activeCam === 'front' ? 'Front Road Optical Feed' : activeCam === 'anpr' ? 'Number Plate Telephoto Zoom' : 'Curb & Shoulder Downward Scanner'}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                }}>
                  {busProfile.name}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                Corridor: <strong>{busProfile.location}</strong> · Driver: {selectedBus?.driver_name || 'Ramesh Kumar'}
              </div>
            </div>

            {/* Quick Camera Angle Switcher */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: 'front', label: 'Front Road Camera' },
                { key: 'anpr', label: 'Number Plate Zoom' },
                { key: 'side', label: 'Curb & Shoulder' },
              ].map((c) => (
                <button
                  key={c.key}
                  className="btn btn-sm"
                  style={{
                    fontSize: 12,
                    padding: '5px 12px',
                    fontWeight: 600,
                    background: activeCam === c.key ? '#2563eb' : '#ffffff',
                    color: activeCam === c.key ? '#ffffff' : '#475569',
                    borderColor: activeCam === c.key ? '#2563eb' : '#e2e8f0',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveCam(c.key as any)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Realistic 3D Canvas Video View */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: 420,
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
            background: '#090d16',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
          }}>
            <canvas
              ref={canvasRef}
              width={1080}
              height={460}
              style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
            />
          </div>

          {/* Dynamic Lens & Sensor Telemetry Bar */}
          <div style={{
            marginTop: 10,
            padding: '8px 14px',
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: '#475569',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span><strong>Lens:</strong> {activeCam === 'front' ? '16mm Ultra-Wide (110° FOV)' : activeCam === 'anpr' ? '85mm Telephoto Zoom (28° FOV)' : '24mm Downward Diagonal (75° FOV)'}</span>
              <span><strong>Resolution:</strong> {activeCam === 'front' ? '3840x2160 (4K 30fps)' : activeCam === 'anpr' ? '1920x1080 (HD 60fps)' : '2560x1440 (2K 30fps)'}</span>
              <span><strong>AI Pipeline:</strong> {activeCam === 'front' ? 'YOLOv8-DefectScanner' : activeCam === 'anpr' ? 'ANPR-PlateOCR & SpeedRadar' : 'CurbAlignment & DrainageDetection'}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 4, border: '1px solid #a7f3d0' }}>
              ● OPTICAL SENSORS SYNCHRONIZED
            </span>
          </div>

          {/* Action Row Under Video */}
          <div style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
              <div>
                <span style={{ color: '#64748b' }}>Current Road Defect: </span>
                <strong style={{ color: '#0f172a' }}>{busProfile.primaryDefect}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Responsible Agency: </span>
                <strong style={{ color: '#2563eb' }}>{busProfile.department}</strong>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleAction}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '7px 18px', background: '#2563eb', border: 'none' }}
            >
              <Send size={13} />
              {busProfile.actionText}
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            EVERY POTHOLE SAVED WITH LOCATION IN THIS BUS'S HISTORY
        ───────────────────────────────────────────────────────────── */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                Detected Potholes & Road Hazard History — {selectedBusId}
              </h2>
              <p style={{ fontSize: 12, color: '#64748b' }}>
                Log of road defects scanned and geotagged by {selectedBusId} on {selectedBus?.route_name || 'Route'}
              </p>
            </div>

            <button
              className="btn btn-sm"
              onClick={exportHistoryCSV}
              style={{
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#334155',
                padding: '6px 14px',
                borderRadius: 8,
              }}
            >
              <Download size={13} /> Export {selectedBusId} History (CSV)
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Record ID</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Time Logged</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Hazard / Defect</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Street / Location</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>GPS Coordinates</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Measured Depth</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Severity</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Action Status</th>
                </tr>
              </thead>
              <tbody>
                {currentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px 14px', textAlign: 'center', color: '#64748b' }}>
                      No defects detected yet on this bus route.
                    </td>
                  </tr>
                ) : (
                  currentHistory.map((rec) => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', color: '#2563eb', fontWeight: 600 }}>
                        {rec.id}
                      </td>
                      <td style={{ padding: '11px 14px', color: '#64748b' }}>
                        {rec.time}
                      </td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f172a' }}>
                        {rec.type}
                      </td>
                      <td style={{ padding: '11px 14px', color: '#334155' }}>
                        {rec.location}
                      </td>
                      <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: '#64748b' }}>
                        {rec.lat.toFixed(5)}, {rec.lng.toFixed(5)}
                      </td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: '#d97706' }}>
                        {rec.depth}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: rec.severity === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
                          color: rec.severity === 'CRITICAL' ? '#dc2626' : '#d97706',
                        }}>
                          {rec.severity}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: rec.status === 'Sent to PWD' ? '#2563eb' : '#059669',
                          background: rec.status === 'Sent to PWD' ? '#eff6ff' : '#ecfdf5',
                          padding: '3px 8px',
                          borderRadius: 6,
                          border: rec.status === 'Sent to PWD' ? '1px solid #bfdbfe' : '1px solid #a7f3d0'
                        }}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
