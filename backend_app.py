"""Minimal FastAPI server for QR check-in prototype.
Place this file in the project root. Run with:
  pip install -r backend-requirements.txt
  uvicorn backend_app:app --reload --port 8000

This file intentionally bundles DB, models, services and routers for fast iteration.
"""
import os
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt
from sqlalchemy import (Column, Integer, String, DateTime, Enum, ForeignKey, create_engine, Boolean)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, Session
from sqlalchemy.exc import IntegrityError
import enum

SECRET_KEY = os.getenv("QR_SECRET", "dev-secret")
ALGORITHM = "HS256"
TOKEN_TTL_SECONDS = int(os.getenv("QR_TTL", "300"))  # 5 minutes default

DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///./dev.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class AttendanceStatus(str, enum.Enum):
    registered = "registered"
    present = "present"
    no_show = "no_show"


class AttendanceMethod(str, enum.Enum):
    qr = "qr"
    manual = "manual"


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    capacity = Column(Integer, nullable=True)


class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(String, nullable=False)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.registered)
    checkin_at = Column(DateTime, nullable=True)
    method = Column(Enum(AttendanceMethod), nullable=True)

    event = relationship("Event", backref="attendees")


class Waitlist(Base):
    __tablename__ = "waitlist"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(String, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    type = Column(String, nullable=False)
    payload = Column(String, nullable=True)
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)


Base.metadata.create_all(bind=engine)

app = FastAPI(title="QR Check-in Prototype")

# Allow local frontend dev (Vite) to call backend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic schemas
class QRTokenResponse(BaseModel):
    token: str
    expires_at: datetime


class CheckinRequest(BaseModel):
    token: Optional[str] = None
    user_id: Optional[str] = None


class AttendanceItem(BaseModel):
    id: int
    event_id: int
    user_id: str
    status: AttendanceStatus
    checkin_at: Optional[datetime]
    method: Optional[AttendanceMethod]

    class Config:
        orm_mode = True


# Utilities
def create_qr_token(event_id: int, user_id: Optional[str] = None, ttl: int = TOKEN_TTL_SECONDS):
    now = datetime.utcnow()
    payload = {"event_id": event_id, "iat": now.timestamp(), "exp": (now + timedelta(seconds=ttl)).timestamp()}
    if user_id:
        payload["user_id"] = user_id
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token, now + timedelta(seconds=ttl)


def decode_qr_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid token")


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Endpoints
@app.get("/events/{event_id}/qr", response_model=QRTokenResponse)
def get_event_qr(event_id: int, user_id: Optional[str] = None):
    # In a real app this would be permissioned; returning a token that encodes event and optional user
    token, expires_at = create_qr_token(event_id, user_id)
    return {"token": token, "expires_at": expires_at}


@app.post("/events/{event_id}/checkin", response_model=AttendanceItem)
def checkin(event_id: int, req: CheckinRequest, db: Session = Depends(get_db)):
    # Accept either token or explicit user_id + some server-side verification
    user_id = None
    if req.token:
        payload = decode_qr_token(req.token)
        if int(payload.get("event_id")) != event_id:
            raise HTTPException(status_code=400, detail="Token event mismatch")
        user_id = payload.get("user_id")
    if req.user_id:
        user_id = req.user_id
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required (or token containing user_id)")

    # Ensure event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Idempotent create-or-update attendance: if existing, mark present
    attendance = db.query(Attendance).filter(Attendance.event_id == event_id, Attendance.user_id == user_id).first()
    now = datetime.utcnow()
    if attendance:
        attendance.status = AttendanceStatus.present
        attendance.checkin_at = now
        attendance.method = AttendanceMethod.qr
    else:
        attendance = Attendance(event_id=event_id, user_id=user_id, status=AttendanceStatus.present, checkin_at=now, method=AttendanceMethod.qr)
        db.add(attendance)
    try:
        db.commit()
        db.refresh(attendance)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=500, detail="DB error")
    return attendance


@app.get("/events/{event_id}/attendance", response_model=List[AttendanceItem])
def list_attendance(event_id: int, db: Session = Depends(get_db)):
    items = db.query(Attendance).filter(Attendance.event_id == event_id).all()
    return items


# Waitlist endpoints
class WaitlistItem(BaseModel):
    id: int
    event_id: int
    user_id: str
    joined_at: datetime

    class Config:
        orm_mode = True


@app.post("/events/{event_id}/waitlist", response_model=WaitlistItem)
def join_waitlist(event_id: int, payload: dict, db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    # prevent duplicate
    existing = db.query(Waitlist).filter(Waitlist.event_id == event_id, Waitlist.user_id == user_id).first()
    if existing:
        return existing
    w = Waitlist(event_id=event_id, user_id=user_id)
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


@app.delete("/events/{event_id}/waitlist")
def leave_waitlist(event_id: int, user_id: str, db: Session = Depends(get_db)):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    existing = db.query(Waitlist).filter(Waitlist.event_id == event_id, Waitlist.user_id == user_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Not on waitlist")
    db.delete(existing)
    db.commit()
    return {"ok": True}


@app.get("/events/{event_id}/waitlist", response_model=List[WaitlistItem])
def get_waitlist(event_id: int, db: Session = Depends(get_db)):
    items = db.query(Waitlist).filter(Waitlist.event_id == event_id).order_by(Waitlist.joined_at).all()
    return items


# Notifications helper
SMTP_ENABLED = os.getenv("SMTP_ENABLED", "false").lower() in ("1", "true", "yes")
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT") or 587)
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM") or "no-reply@iub.edu.bd"


def send_email(to_email: str, subject: str, body: str):
    if not SMTP_ENABLED:
        print(f"[Email stub] to={to_email} subject={subject} body={body}")
        return True
    try:
        import smtplib
        from email.message import EmailMessage

        msg = EmailMessage()
        msg["From"] = SMTP_FROM
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content(body)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
            s.starttls()
            if SMTP_USER and SMTP_PASS:
                s.login(SMTP_USER, SMTP_PASS)
            s.send_message(msg)
        print(f"[Email] sent to {to_email}")
        return True
    except Exception as e:
        print(f"[Email error] {e}")
        return False


def send_notification(db: Session, user_id: str, ntype: str, payload: str):
    n = Notification(user_id=user_id, type=ntype, payload=payload, sent=False)
    db.add(n)
    db.commit()
    db.refresh(n)
    # Try to send email if user looks like an email (simple heuristic)
    if SMTP_ENABLED and "@" in user_id:
        send_email(user_id, f"Notification: {ntype}", payload)
        n.sent = True
        n.sent_at = datetime.utcnow()
        db.commit()
    else:
        # Log/mark as sent for prototype
        n.sent = True
        n.sent_at = datetime.utcnow()
        db.commit()
        print(f"[Notification stub] to {user_id}: {ntype} - {payload}")


@app.post("/events/{event_id}/process-waitlist")
def process_waitlist(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event.capacity:
        return {"ok": False, "reason": "Event has no capacity limit"}
    # count registered/present attendees
    occupied = db.query(Attendance).filter(Attendance.event_id == event_id).filter(Attendance.status.in_([AttendanceStatus.registered, AttendanceStatus.present])).count()
    if occupied >= event.capacity:
        return {"ok": False, "reason": "No free spots"}
    # get next waitlisted
    next_w = db.query(Waitlist).filter(Waitlist.event_id == event_id).order_by(Waitlist.joined_at).first()
    if not next_w:
        return {"ok": False, "reason": "No waitlisted users"}
    # promote
    new_reg = Attendance(event_id=event_id, user_id=next_w.user_id, status=AttendanceStatus.registered)
    db.add(new_reg)
    db.delete(next_w)
    db.commit()
    db.refresh(new_reg)
    # notify user
    send_notification(db, new_reg.user_id, "waitlist_promoted", f"You have been registered for event {event.title}")
    return {"ok": True, "user_id": new_reg.user_id}


# Helper: create sample event for testing
@app.post("/events/create-sample")
def create_sample_event(title: str = "Sample Event", capacity: int = 100, db: Session = Depends(get_db)):
    e = Event(title=title, capacity=capacity)
    db.add(e)
    db.commit()
    db.refresh(e)
    return {"id": e.id, "title": e.title, "capacity": e.capacity}
