from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# --- WORKFLOW INPUT CONTRACT ---
class ComplaintInput(BaseModel):
    complaint_id: str
    user_id: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    voice_transcript: Optional[str] = None
    latitude: float
    longitude: float
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

# --- AI ANALYSIS TASK OUTPUTS ---
class ImageAnalysisResult(BaseModel):
    detected_objects: List[str] = Field(default_factory=list)
    problem_category: str = "other"
    visual_description: str = ""
    confidence: float = 0.5
    hazard_signals: List[str] = Field(default_factory=list)

class TextAnalysisResult(BaseModel):
    problem_category: str = "other"
    intent: str = "unspecified"
    entities: List[str] = Field(default_factory=list)
    summary: str = ""
    confidence: float = 0.5
    detected_language: str = "English"


class SeverityResult(BaseModel):
    severity: str # LOW | MEDIUM | HIGH | CRITICAL
    severity_score: int # 0 - 100
    reason: str
    confidence: float

class DuplicateResult(BaseModel):
    is_duplicate: bool
    duplicate_complaint_id: Optional[str] = None
    similarity_score: float
    reason: str
    evidence_breakdown: Optional[Dict[str, float]] = None

# --- RULE ENGINE OUTPUTS ---
class JurisdictionResult(BaseModel):
    ward_id: str
    ward_name: str
    zone_id: str
    city: str = "Chennai"
    municipality: str = "Greater Chennai Corporation"

class AssetOwnershipResult(BaseModel):
    asset_type: str
    asset_owner: str # Municipal Corporation, Highways Dept, CMWSSB, TNEB

class DepartmentResult(BaseModel):
    department_id: str
    department_name: str
    officer_id: Optional[str] = None

class SLAResult(BaseModel):
    sla_hours: int
    deadline: datetime
    policy_code: str

class EscalationResult(BaseModel):
    escalation_hierarchy: List[str]

class RuleEngineResult(BaseModel):
    jurisdiction: str
    asset_owner: str
    department: str
    sla_hours: int
    escalation_path: List[str]

# --- DECISION FUSION OUTPUT ---
class DecisionFusionResult(BaseModel):
    problem: str
    category: str
    severity: str
    severity_score: int
    ai_confidence: float
    duplicate: bool
    duplicate_of_id: Optional[str] = None
    jurisdiction: str
    asset_owner: str
    department: str
    sla_hours: int
    priority: str
    escalation_path: List[str]
    human_verification_required: bool
    decision_reason: str
    timestamp: str

# --- STATUS API CONTRACT ---
class WorkflowStatusResponse(BaseModel):
    complaint_id: str
    workflow_run_id: Optional[str] = None
    status: str # RECEIVED, PROCESSING, AI_ANALYSIS, DUPLICATE_CHECK, RULE_EVALUATION, DECISION_READY, ROUTED, MANUAL_REVIEW, FAILED, RESOLVED
    progress: int # 0 to 100
    current_step: Optional[str] = None
    decision: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
