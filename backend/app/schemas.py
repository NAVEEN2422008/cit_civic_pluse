from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, EmailStr, Field

# Available Languages
class LanguageEnum(str):
    ENGLISH = "English"
    TAMIL = "Tamil"
    HINDI = "Hindi"
    TELUGU = "Telugu"
    KANNADA = "Kannada"
    MALAYALAM = "Malayalam"
    BENGALI = "Bengali"

# OTP Requests
class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=4, max_length=6)

# Identity Check
class IdentityCheckRequest(BaseModel):
    demo_aadhaar_number: str = Field(..., min_length=12, max_length=12)

class IdentityCheckResponse(BaseModel):
    valid: bool
    identity_reference: Optional[str] = None
    message: str

# Registration Request
class RegisterCitizenRequest(BaseModel):
    email: EmailStr
    demo_aadhaar_number: str = Field(..., min_length=12, max_length=12)
    preferred_language: str = "English"
    password: Optional[str] = Field(None, min_length=6)

# Login Requests
class LoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    otp_code: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Token Responses
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    preferred_language: str

# User Response
class UserResponse(BaseModel):
    civic_user_id: str
    email: str
    mobile: Optional[str] = None
    preferred_language: str
    identity_verified: bool
    role: str
    account_status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- MODULE 2 & 8 SCHEMAS ---

class PublicIssueResponse(BaseModel):
    id: str
    category: str
    title_ta: str
    title_en: str
    location_ward: str
    status: str
    supporters_count: int
    reports_count: int
    created_at: datetime
    priority: str
    photo_url: Optional[str] = None

class HeatmapPointResponse(BaseModel):
    latitude: float
    longitude: float
    density_score: int
    category: str
    location_ward: str

class TimelineStepResponse(BaseModel):
    step_key: str
    title: str
    description: str
    timestamp: Optional[datetime] = None
    is_completed: bool
    is_current: bool

class IssueDetailResponse(BaseModel):
    id: str
    offline_submission_id: Optional[str] = None
    original_description: Optional[str] = None
    processed_description: Optional[str] = None
    original_language: str = "English"
    voice_url: Optional[str] = None
    voice_transcript: Optional[str] = None
    ai_category: Optional[str] = "ROADS"
    ai_issue_type: Optional[str] = "POTHOLE"
    ai_severity: Optional[str] = "HIGH"
    ai_confidence: Optional[float] = 0.94
    ai_review_status: str = "AUTO_APPROVED"
    is_duplicate: bool = False
    reports_count: int = 1
    supporters_count: int = 1
    media_url: Optional[str] = None
    resolution_after_photo: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    citizen_confirmation_status: str = "PENDING"
    latitude: float
    longitude: float
    location_ward: str
    status: str
    created_at: datetime
    sla_days_remaining: int = 3
    department: str = "Highways & Potholes"
    timeline_steps: List[TimelineStepResponse]

class DashboardSummaryResponse(BaseModel):
    active_count: int
    processing_count: int
    resolved_count: int
    reopened_count: int
    my_complaints: List[PublicIssueResponse]
    public_nearby_issues: List[PublicIssueResponse]

# --- MODULE 3, 4, 5, 6, 7, 8, 9 & 10 SCHEMAS ---

class IssueCreateRequest(BaseModel):
    offline_submission_id: Optional[str] = None
    description: Optional[str] = None
    language: str = "English"
    media_url: Optional[str] = None
    voice_url: Optional[str] = None
    latitude: float
    longitude: float
    location_source: str = "GPS"
    location_accuracy: Optional[float] = 10.0
    location_ward: Optional[str] = "Ward General, Chennai"

class TranscriptCorrectionRequest(BaseModel):
    corrected_transcript: Optional[str] = None
    corrected_description: Optional[str] = None

class ReopenRequest(BaseModel):
    reason: str = Field(..., min_length=5)
    proof_photo: str = Field(..., min_length=10) # Base64 or URL photo proof mandatory
    additional_notes: Optional[str] = None

class PublicVerifyVoteRequest(BaseModel):
    vote: str = "CONFIRM" # "CONFIRM" | "REJECT"
    latitude: float
    longitude: float

class IssueResponse(BaseModel):
    id: str
    offline_submission_id: Optional[str] = None
    reporter_id: str
    
    # Dual-Text & Sarvam AI Language Fields
    original_description: Optional[str] = None
    processed_description: Optional[str] = None
    description: Optional[str] = None
    
    original_language: str = "English"
    processing_language: str = "English"
    language: str = "English"
    
    voice_url: Optional[str] = None
    voice_transcript: Optional[str] = None
    language_processing_status: str = "PENDING"
    
    # Module 6 AI Categorization Fields
    ai_category: Optional[str] = None
    ai_issue_type: Optional[str] = None
    ai_severity: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_reason: Optional[str] = None
    ai_processed_at: Optional[datetime] = None
    ai_model_name: Optional[str] = None
    ai_review_status: str = "AUTO_APPROVED"
    
    # Module 7 Duplicate Detection Fields
    is_duplicate: bool = False
    duplicate_of_id: Optional[str] = None
    reports_count: int = 1
    supporters_count: int = 1
    duplicate_score: Optional[float] = None
    duplicate_confidence_breakdown: Optional[str] = None

    # Module 9 Resolution & Verification Fields
    resolution_after_photo: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    citizen_confirmation_status: str = "PENDING"
    reopen_reason: Optional[str] = None
    reopen_proof_photo: Optional[str] = None
    verification_score: Optional[float] = None
    verification_reason: Optional[str] = None
    verification_status: str = "NONE"
    public_verification_eligible: bool = False

    # Module 10 Security & Anti-Spam Fields
    spam_score: float = 0.0
    abuse_score: float = 0.0

    media_url: Optional[str] = None
    latitude: float
    longitude: float
    location_source: str
    location_accuracy: Optional[float] = None
    location_ward: str
    status: str
    sync_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
