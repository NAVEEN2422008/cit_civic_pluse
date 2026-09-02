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

# Citizen Login Request
class LoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    otp_code: Optional[str] = None

# Officer Login Request
class OfficerLoginRequest(BaseModel):
    officer_id: str = Field(..., min_length=3)
    password: str = Field(..., min_length=4)

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Token Responses
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    preferred_language: str = "English"

# User Response
class UserResponse(BaseModel):
    civic_user_id: str
    email: Optional[str] = None
    officer_id: Optional[str] = None
    name: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[str] = None
    preferred_language: str = "English"
    identity_verified: bool = False
    identity_reference: Optional[str] = None
    role: str = "CITIZEN"
    account_status: str = "ACTIVE"
    created_at: datetime
    spam_score: Optional[float] = None
    abuse_score: Optional[float] = None

class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict] = None

# SLA Policy & Pause Schemas
class SLAPauseRequest(BaseModel):
    pause_reason: str # AWAITING_APPROVAL, AWAITING_EXTERNAL_AGENCY, COURT_HOLD, NATURAL_DISASTER, MATERIAL_UNAVAILABLE
    notes: Optional[str] = None

class SLAModeRequest(BaseModel):
    is_demo_mode: bool

# Officer Portal Action Requests
class AcceptTaskRequest(BaseModel):
    notes: Optional[str] = None

class SiteInspectionRequest(BaseModel):
    latitude: float
    longitude: float
    site_photo_url: Optional[str] = None
    problem_condition: str
    severity: str = "MEDIUM"
    dimensions: Optional[str] = None
    safety_risk: str = "LOW"
    required_materials: Optional[str] = None
    required_manpower: int = 2
    preliminary_estimate: float = 0.0
    inspection_notes: Optional[str] = None
    recommended_action: str

class BudgetApprovalRequest(BaseModel):
    estimated_cost: float
    reason: str

class BudgetDecisionRequest(BaseModel):
    approved: bool
    notes: Optional[str] = None

class CreateWorkOrderRequest(BaseModel):
    work_description: str
    materials: Optional[str] = None
    manpower: int = 2
    estimated_cost: float
    assigned_team: str
    deadline_days: int = 3
    priority: str = "MEDIUM"

class UpdateWorkProgressRequest(BaseModel):
    status: str
    notes: Optional[str] = None
    progress_photo_url: Optional[str] = None

class ResolutionEvidenceRequest(BaseModel):
    before_photo_url: Optional[str] = None
    after_photo_url: str
    completion_notes: str
    completion_latitude: float
    completion_longitude: float

# Dashboard & Citizen Schemas
class DashboardSummaryResponse(BaseModel):
    active_count: int = 0
    processing_count: int = 0
    resolved_count: int = 0
    reopened_count: int = 0
    my_complaints: List[Dict] = []
    public_nearby_issues: List[Dict] = []

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
    id: Optional[str] = None
    category: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    intensity: Optional[float] = None
    ward: Optional[str] = None
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    density_score: Optional[int] = None
    location_ward: Optional[str] = None

class TimelineStepResponse(BaseModel):
    step_number: Optional[int] = None
    title: str
    status: Optional[str] = None
    completed_at: Optional[datetime] = None
    description: str = ""
    step_key: Optional[str] = None
    is_completed: Optional[bool] = None
    is_current: Optional[bool] = None

class IssueDetailResponse(BaseModel):
    id: str
    original_description: Optional[str] = None
    processed_description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    status: str
    location_ward: str
    created_at: datetime
    timeline: List[TimelineStepResponse] = []
    offline_submission_id: Optional[str] = None
    voice_url: Optional[str] = None
    voice_transcript: Optional[str] = None
    ai_category: Optional[str] = None
    ai_issue_type: Optional[str] = None
    ai_severity: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_review_status: Optional[str] = None
    is_duplicate: bool = False
    reports_count: int = 0
    supporters_count: int = 0
    media_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    sla_days_remaining: Optional[int] = None
    department: Optional[str] = None
    timeline_steps: List[TimelineStepResponse] = []

# Issue Schemas
class IssueCreateRequest(BaseModel):
    offline_submission_id: Optional[str] = None
    description: Optional[str] = None
    language: str = "English"
    media_url: Optional[str] = None
    voice_url: Optional[str] = None
    latitude: float
    longitude: float
    location_source: str = "GPS"
    location_accuracy: Optional[float] = None
    location_ward: str = "Ward General"

class TranscriptCorrectionRequest(BaseModel):
    corrected_transcript: str

class ReopenRequest(BaseModel):
    reopen_reason: str
    reopen_proof_photo: Optional[str] = None

class PublicVerifyVoteRequest(BaseModel):
    confirmed: bool
    note: Optional[str] = None

class IssueResponse(BaseModel):
    id: str
    reporter_id: str
    original_description: Optional[str] = None
    processed_description: Optional[str] = None
    description: Optional[str] = None
    original_language: str
    processing_language: str
    language_processing_status: str
    voice_url: Optional[str] = None
    voice_transcript: Optional[str] = None
    ai_category: Optional[str] = None
    ai_issue_type: Optional[str] = None
    ai_severity: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_reason: Optional[str] = None
    ai_review_status: Optional[str] = None
    is_duplicate: bool = False
    duplicate_of_id: Optional[str] = None
    duplicate_score: Optional[float] = None
    reports_count: int = 1
    supporters_count: int = 1
    resolution_after_photo: Optional[str] = None
    resolution_notes: Optional[str] = None
    citizen_confirmation_status: str = "PENDING"
    reopen_reason: Optional[str] = None
    reopen_proof_photo: Optional[str] = None
    verification_score: Optional[float] = None
    verification_reason: Optional[str] = None
    verification_status: str = "NONE"
    media_url: Optional[str] = None
    latitude: float
    longitude: float
    location_source: str
    location_accuracy: Optional[float] = None
    location_ward: str
    status: str
    created_at: datetime
    spam_score: Optional[float] = None
    abuse_score: Optional[float] = None
