# RakshAI
## Intelligent Mobile Urban Sensing & Road Safety Platform

> Transforms municipal public transport buses into intelligent mobile sensing units. Continuously audits road quality (potholes, waterlogging, damaged signage, missing zebra crossings), tracks traffic congestion bottlenecks, detects pedestrian hazards, and performs high-speed Automatic Number Plate Recognition (ANPR) to flag hit-and-run and rash driving incidents.

---

## 🏛️ Municipal & Department Value Proposition
- **Public Works Department (PWD):** Automated road audit replaces manual surveys. Potholes and tarmac damages are logged with GPS, depth measurement, and instant work orders.
- **Traffic Police HQ:** Real-time ANPR extracts offending vehicle license plates, speed telemetry, and collision coordinates within seconds.
- **Municipal Corporation (Sanitation):** Detects waterlogging hotspots and open manholes across the entire arterial road grid.
- **Zero Costly Fixed Infrastructure:** Saves ₹10Cr+ by turning existing city transit buses into AI mobile inspectors.

---

## 🚀 Quickstart

### Backend (FastAPI + Python 3.11)
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- API Documentation: `http://localhost:8000/docs`
- Live Telemetry WebSocket: `ws://localhost:8000/ws/live`

### Frontend (React + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`
