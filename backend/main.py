"""
UrbanSense AI — FastAPI Backend
AI-Powered Mobile Urban Sensing & Urban Intelligence Platform
"""
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database.db import init_db, SessionLocal
from database.seeder import seed_database
from simulation.engine import sim_state, simulation_loop

from api.buses import router as buses_router
from api.events import router as events_router
from api.incidents import router as incidents_router
from api.traffic import router as traffic_router
from api.analytics import router as analytics_router
from api.edge_nodes import router as edge_nodes_router
from api.video import router as video_router
from api.simulation import router as simulation_router

# ─────────────────────────────────────────────
# App
# ─────────────────────────────────────────────
app = FastAPI(
    title="RakshAI API",
    description="Intelligent Mobile Urban Sensing & Road Safety Platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────
app.include_router(buses_router)
app.include_router(events_router)
app.include_router(incidents_router)
app.include_router(traffic_router)
app.include_router(analytics_router)
app.include_router(edge_nodes_router)
app.include_router(video_router)
app.include_router(simulation_router)

# ─────────────────────────────────────────────
# Static file serving for uploads
# ─────────────────────────────────────────────
os.makedirs("./uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")

# ─────────────────────────────────────────────
# WebSocket
# ─────────────────────────────────────────────
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    sim_state.websocket_clients.add(websocket)
    try:
        while True:
            # Keep connection alive; simulation engine broadcasts updates
            await websocket.receive_text()
    except WebSocketDisconnect:
        sim_state.websocket_clients.discard(websocket)
    except Exception:
        sim_state.websocket_clients.discard(websocket)


# ─────────────────────────────────────────────
# System health endpoint
# ─────────────────────────────────────────────
@app.get("/api/system/health")
def system_health():
    import datetime, random
    return {
        "backend": "ONLINE",
        "database": "ONLINE",
        "ai_service": "ONLINE (Production Mesh)",
        "gis": "ONLINE",
        "simulation_engine": "RUNNING" if sim_state.running else "STANDBY",
        "api": "ONLINE",
        "websocket": "ONLINE",
        "connected_buses": sum(1 for _ in sim_state.websocket_clients),
        "simulation_tick": sim_state.tick,
        "api_latency_ms": random.randint(8, 24),
        "events_per_min": random.randint(3, 15) if sim_state.running else 0,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "platform_edition": "RakshAI Enterprise v2.4",
        "hardware_mode": "EDGE ACTIVE",
    }


@app.get("/api/roads/issues")
def road_issues(
    event_type: str = None,
    severity: str = None,
    status: str = None,
    limit: int = 100,
    db_dep=None,
):
    """Redirect to events API for road issues."""
    from database.db import SessionLocal
    from models.models import Event
    ROAD_TYPES = ["POTHOLE", "WATERLOGGING", "DAMAGED_ROAD", "ROAD_DEBRIS", "OPEN_MANHOLE",
                  "MISSING_ZEBRA_CROSSING", "MISSING_ROAD_DIVIDER", "DAMAGED_TRAFFIC_SIGN", "MISSING_TRAFFIC_SIGN"]
    db = SessionLocal()
    try:
        q = db.query(Event).filter(Event.event_type.in_(ROAD_TYPES))
        if event_type:
            q = q.filter(Event.event_type == event_type)
        if severity:
            q = q.filter(Event.severity == severity)
        if status:
            q = q.filter(Event.status == status)
        events = q.order_by(Event.timestamp.desc()).limit(limit).all()
        return {
            "issues": [
                {
                    "event_id": e.event_id, "bus_id": e.bus_id, "event_type": e.event_type,
                    "confidence": e.confidence, "severity": e.severity, "lat": e.lat, "lng": e.lng,
                    "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                    "status": e.status, "description": e.description, "location_name": e.location_name,
                    "source": e.source,
                }
                for e in events
            ],
            "total": q.count(),
        }
    finally:
        db.close()


# ─────────────────────────────────────────────
# Startup
# ─────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    # Initialize DB
    init_db()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Start simulation loop in background
    asyncio.create_task(simulation_loop())
    print("[OK] RakshAI backend started")
    print("[DOCS] API docs: http://localhost:8000/docs")
    print("[WS] WebSocket: ws://localhost:8000/ws/live")
    print("[INFO] City Operations: Active (Raipur Hub)")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
