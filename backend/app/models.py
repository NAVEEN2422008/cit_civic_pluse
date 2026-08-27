import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    mobile = Column(String, nullable=True)
    preferred_language = Column(String, default="English", nullable=False)
    identity_verified = Column(Boolean, default=False, nullable=False)
    identity_reference = Column(String, nullable=True, index=True)
    role = Column(String, default="CITIZEN", nullable=False) # CITIZEN, OFFICER, SUPERVISOR, ADMIN
    account_status = Column(String, default="ACTIVE", nullable=False) # ACTIVE, PENDING, SUSPENDED
    account_reputation = Column(Float, default=1.0, nullable=False) # 0.0 to 1.0
    device_reputation = Column(Float, default=1.0, nullable=False)
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class MockIdentity(Base):
    __tablename__ = "mock_identity"

    identity_reference = Column(String, primary_key=True, index=True)
    mock_identity_hash = Column(String, unique=True, index=True, nullable=False)
    registered_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    is_registered = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class OTPStore(Base):
    __tablename__ = "otp_store"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, index=True, nullable=False)
    otp_code = Column(String, nullable=False)
    attempts = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class IssueSupport(Base):
    __tablename__ = "issue_supports"

    id = Column(String, primary_key=True, default=generate_uuid)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# --- MODULE 3, 4, 5, 6, 7, 8, 9 & 10 ISSUE DATA MODEL ---
class Issue(Base):
    __tablename__ = "issues"

    id = Column(String, primary_key=True, default=lambda: f"TN-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}", index=True)
    offline_submission_id = Column(String, unique=True, index=True, nullable=True)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Dual-Text & Sarvam AI Language Fields
    original_description = Column(Text, nullable=True)
    processed_description = Column(Text, nullable=True)
    description = Column(Text, nullable=True) # Legacy/Fallback field
    
    original_language = Column(String, default="English", nullable=False)
    processing_language = Column(String, default="English", nullable=False)
    language = Column(String, default="English", nullable=False) # Legacy/Fallback field
    
    voice_url = Column(Text, nullable=True)
    voice_transcript = Column(Text, nullable=True)
    language_processing_status = Column(String, default="PENDING", nullable=False) # PENDING, COMPLETED, FAILED
    
    # Module 6 AI Categorization Fields
    ai_category = Column(String, nullable=True) # ROADS, GARBAGE, STREETLIGHT, DRAINAGE, WATER, FOOTPATH, PUBLIC_SAFETY, PARKS, PUBLIC_INFRASTRUCTURE, OTHER
    ai_issue_type = Column(String, nullable=True) # POTHOLE, OVERFLOWING_BIN, BROKEN_POLE, etc.
    ai_severity = Column(String, nullable=True) # LOW, MEDIUM, HIGH, CRITICAL
    ai_confidence = Column(Float, nullable=True) # 0.0 to 1.0
    ai_reason = Column(Text, nullable=True)
    ai_processed_at = Column(DateTime, nullable=True)
    ai_model_name = Column(String, default="gemini-2.5-flash", nullable=False)
    ai_review_status = Column(String, default="AUTO_APPROVED", nullable=False) # AUTO_APPROVED, AI_REVIEW_REQUIRED, SPAM_SUSPECTED

    # Module 7 Duplicate Detection Fields
    is_duplicate = Column(Boolean, default=False, nullable=False)
    duplicate_of_id = Column(String, ForeignKey("issues.id"), nullable=True, index=True)
    reports_count = Column(Integer, default=1, nullable=False)
    supporters_count = Column(Integer, default=1, nullable=False)
    duplicate_score = Column(Float, nullable=True)
    duplicate_confidence_breakdown = Column(Text, nullable=True) # JSON string

    # Module 9 Resolution & Verification Fields
    resolution_after_photo = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    citizen_confirmation_status = Column(String, default="PENDING", nullable=False) # PENDING, CONFIRMED, REOPENED
    
    reopen_reason = Column(Text, nullable=True)
    reopen_proof_photo = Column(Text, nullable=True)
    
    verification_score = Column(Float, nullable=True) # AI Reopen verification score (0.0 to 1.0)
    verification_reason = Column(Text, nullable=True)
    verification_status = Column(String, default="NONE", nullable=False) # NONE, AI_VERIFIED, REQUIRES_SUPERVISOR_REVIEW
    public_verification_eligible = Column(Boolean, default=False, nullable=False) # 15-day rule transition

    # Module 10 Security & Abuse Fields
    spam_score = Column(Float, default=0.0, nullable=False) # 0.0 to 1.0
    abuse_score = Column(Float, default=0.0, nullable=False) # 0.0 to 1.0

    media_url = Column(Text, nullable=True)
    
    # Location fields
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_source = Column(String, default="GPS", nullable=False) # GPS, EXIF, MANUAL
    location_accuracy = Column(Float, nullable=True)
    location_ward = Column(String, default="Ward General", nullable=False)

    status = Column(String, default="OPEN", nullable=False) # OPEN, PROCESSING, PENDING_CONFIRMATION, RESOLVED, REOPEN_REQUESTED, CLOSED, PUBLIC_VERIFICATION_AVAILABLE
    sync_status = Column(String, default="SYNCED", nullable=False) # SYNCED, PENDING_SYNC
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=True)
    event_type = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
