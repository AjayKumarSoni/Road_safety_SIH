from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from database.db import get_db
from models.models import VideoJob, Event
import uuid, os, asyncio, random, datetime

router = APIRouter(prefix="/api/video", tags=["Video Analytics"])

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Simulated detection classes
DETECTION_CLASSES = [
    ("car", 0.35), ("motorcycle", 0.20), ("truck", 0.10), ("bus", 0.05),
    ("pedestrian", 0.15), ("bicycle", 0.05), ("pothole", 0.04), ("waterlogging", 0.03),
    ("traffic_sign", 0.02), ("road_hazard", 0.01),
]

def weighted_pick(choices):
    r = random.random()
    cumulative = 0
    for item, w in choices:
        cumulative += w
        if r <= cumulative:
            return item
    return choices[0][0]


async def process_video_job(job_id: str, file_path: str, bus_id: str):
    """Simulated AI processing of video file."""
    db_local = None
    try:
        from database.db import SessionLocal
        db_local = SessionLocal()
        job = db_local.query(VideoJob).filter(VideoJob.id == job_id).first()
        if not job:
            return
        job.status = "PROCESSING"
        job.total_frames = random.randint(450, 900)
        db_local.commit()

        # Simulate processing frames
        detections = []
        total_frames = job.total_frames
        for frame_num in range(0, total_frames, 30):
            await asyncio.sleep(0.2)  # simulate processing time
            num_detections = random.randint(2, 8)
            frame_dets = []
            for _ in range(num_detections):
                cls = weighted_pick(DETECTION_CLASSES)
                det = {
                    "frame": frame_num,
                    "timestamp_sec": round(frame_num / 30.0, 2),
                    "class": cls,
                    "confidence": round(random.uniform(0.65, 0.97), 2),
                    "track_id": random.randint(1, 50),
                    "bbox": [
                        random.randint(50, 400),
                        random.randint(50, 300),
                        random.randint(60, 200),
                        random.randint(40, 150),
                    ],  # x, y, w, h
                }
                if cls in ("pothole", "waterlogging", "road_hazard"):
                    det["is_road_event"] = True
                frame_dets.append(det)
            detections.extend(frame_dets)
            job.progress = int((frame_num / total_frames) * 100)
            db_local.commit()

        # Generate events from detections
        events_count = 0
        for det in detections:
            if det.get("is_road_event") and random.random() < 0.3:
                etype = "POTHOLE" if det["class"] == "pothole" else ("WATERLOGGING" if det["class"] == "waterlogging" else "ROAD_DEBRIS")
                event = Event(
                    event_id=f"EVT-V{random.randint(30000, 39999)}",
                    bus_id=bus_id,
                    event_type=etype,
                    confidence=det["confidence"],
                    severity=random.choice(["MEDIUM", "HIGH"]),
                    lat=21.2514 + random.uniform(-0.01, 0.01),
                    lng=81.6296 + random.uniform(-0.01, 0.01),
                    source="SIMULATED_VIDEO_AI",
                    description=f"[VIDEO_AI] {etype.replace('_', ' ').title()} detected in uploaded video at {det['timestamp_sec']}s",
                    location_name="Video Analysis Result",
                    status="NEW",
                    metadata_json={"simulated": True, "from_video": True, "frame": det["frame"]},
                )
                db_local.add(event)
                events_count += 1

        job.status = "COMPLETED"
        job.progress = 100
        job.detections_count = len(detections)
        job.events_generated = events_count
        job.completed_at = datetime.datetime.utcnow()
        job.detections = detections[:200]  # store sample
        db_local.commit()

    except Exception as e:
        print(f"Video processing error: {e}")
        if db_local:
            job = db_local.query(VideoJob).filter(VideoJob.id == job_id).first()
            if job:
                job.status = "FAILED"
                db_local.commit()
    finally:
        if db_local:
            db_local.close()


@router.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    bus_id: str = Form(default="BUS-001"),
    db: Session = Depends(get_db),
):
    job_id = str(uuid.uuid4())[:8].upper()
    ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}{ext}")

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    job = VideoJob(
        id=job_id,
        filename=file.filename,
        file_path=file_path,
        bus_id=bus_id,
        status="QUEUED",
        progress=0,
    )
    db.add(job)
    db.commit()

    background_tasks.add_task(process_video_job, job_id, file_path, bus_id)
    return {"job_id": job_id, "status": "QUEUED", "filename": file.filename}


@router.get("/jobs")
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(VideoJob).order_by(VideoJob.created_at.desc()).limit(20).all()
    return {
        "jobs": [
            {
                "id": j.id,
                "filename": j.filename,
                "bus_id": j.bus_id,
                "status": j.status,
                "progress": j.progress,
                "total_frames": j.total_frames,
                "detections_count": j.detections_count,
                "events_generated": j.events_generated,
                "created_at": j.created_at.isoformat() if j.created_at else None,
                "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            }
            for j in jobs
        ]
    }


@router.get("/jobs/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)):
    j = db.query(VideoJob).filter(VideoJob.id == job_id).first()
    if not j:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": j.id,
        "filename": j.filename,
        "bus_id": j.bus_id,
        "status": j.status,
        "progress": j.progress,
        "total_frames": j.total_frames,
        "detections_count": j.detections_count,
        "events_generated": j.events_generated,
        "created_at": j.created_at.isoformat() if j.created_at else None,
        "completed_at": j.completed_at.isoformat() if j.completed_at else None,
        "detections": j.detections or [],
    }
