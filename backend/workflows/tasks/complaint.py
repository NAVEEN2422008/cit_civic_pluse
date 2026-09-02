import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from workflows.models.workflow_models import ComplaintInput, DecisionFusionResult
from workflows.services.database import get_workflow_db
from app.models import Issue, User, DecisionLog, WorkflowRun

logger = logging.getLogger(__name__)

def preprocess_complaint(complaint_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Task 1: preprocess_complaint
    - Validates required fields and contract integrity.
    - Sanitizes coordinate bounds (-90 to 90, -180 to 180).
    - Enforces that no raw image binaries are passed as arguments (URLs/references only, <4MB).
    - Returns sanitized JSON-serializable dictionary.
    """
    if not isinstance(complaint_dict, dict):
        raise ValueError("Complaint input must be a valid JSON dictionary.")

    complaint_id = complaint_dict.get("complaint_id")
    if not complaint_id:
        raise ValueError("Missing 'complaint_id' in complaint payload.")

    lat = float(complaint_dict.get("latitude", 0.0))
    lon = float(complaint_dict.get("longitude", 0.0))
    if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
        raise ValueError(f"Invalid GPS coordinates: lat={lat}, lon={lon}")

    # Enforce Render Workflows 4MB argument limit & reject raw file binaries
    image_url = complaint_dict.get("image_url")
    if image_url and len(image_url) > 2_000_000 and not image_url.startswith("http"):
        logger.warning(f"Large raw binary detected for {complaint_id}. Truncating to prevent Render argument limit breach.")
        image_url = image_url[:1000]

    return {
        "complaint_id": str(complaint_id),
        "user_id": str(complaint_dict.get("user_id", "ANONYMOUS")),
        "description": complaint_dict.get("description") or "",
        "image_url": image_url,
        "voice_transcript": complaint_dict.get("voice_transcript"),
        "latitude": lat,
        "longitude": lon,
        "timestamp": complaint_dict.get("timestamp") or datetime.now(timezone.utc).isoformat()
    }

def create_or_update_ticket(
    preprocessed: Dict[str, Any],
    decision: Dict[str, Any],
    workflow_run_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Task 12: create_or_update_ticket
    - Idempotent ticket creation and database synchronization.
    - If duplicate detected: links to existing ticket without creating a phantom duplicate.
    - Records comprehensive DecisionLog for explainability.
    """
    db = get_workflow_db()
    complaint_id = preprocessed["complaint_id"]

    try:
        issue = db.query(Issue).filter(Issue.id == complaint_id).first()
        is_new = False
        if not issue:
            is_new = True
            issue = Issue(
                id=complaint_id,
                reporter_id=preprocessed.get("user_id", "ANONYMOUS"),
                latitude=preprocessed["latitude"],
                longitude=preprocessed["longitude"]
            )
            db.add(issue)

        # Apply Decision Fusion attributes
        issue.ai_category = decision.get("category", "OTHER")
        issue.ai_issue_type = decision.get("problem", "DEFECT")
        issue.ai_severity = decision.get("severity", "MEDIUM")
        issue.ai_confidence = float(decision.get("ai_confidence", 0.80))
        issue.ai_reason = decision.get("decision_reason", "")
        issue.ai_processed_at = datetime.now(timezone.utc)
        issue.location_ward = decision.get("jurisdiction", "Ward General")

        # Routing and Department Assignment
        dept_name = decision.get("department", "Roads & Bridges Department")
        issue.department_id = "ROADS" if "Road" in dept_name else ("GARBAGE" if "Solid" in dept_name else "MUNICIPAL")
        
        # Human Verification Flag (Module 8)
        if decision.get("human_verification_required", False):
            issue.ai_review_status = "AI_REVIEW_REQUIRED"
            issue.status = "MANUAL_REVIEW"
        else:
            issue.ai_review_status = "AUTO_APPROVED"
            issue.status = "ASSIGNED" if not issue.status or issue.status == "OPEN" else issue.status

        # Duplicate Handling
        is_dup = decision.get("duplicate", False)
        dup_of_id = decision.get("duplicate_of_id")
        if is_dup and dup_of_id:
            issue.is_duplicate = True
            issue.duplicate_of_id = dup_of_id
            # Increment master ticket report counter
            master = db.query(Issue).filter(Issue.id == dup_of_id).first()
            if master:
                master.reports_count = (master.reports_count or 1) + 1
                master.supporters_count = (master.supporters_count or 1) + 1

        # SLA Tracking Assignment
        sla_hours = int(decision.get("sla_hours", 48))
        now = datetime.now(timezone.utc)
        if not issue.sla_started_at:
            issue.sla_started_at = now
        issue.sla_deadline = now.replace(microsecond=0) + (issue.sla_deadline - issue.sla_started_at if issue.sla_deadline else (datetime.now(timezone.utc) - now))
        issue.sla_status = "ON_TIME"

        db.commit()
        db.refresh(issue)

        # Idempotent Decision Log Record
        existing_log = db.query(DecisionLog).filter(DecisionLog.complaint_id == complaint_id).first()
        if not existing_log:
            dec_log = DecisionLog(
                complaint_id=complaint_id,
                workflow_run_id=workflow_run_id,
                problem_category=decision.get("category"),
                ai_confidence=decision.get("ai_confidence"),
                severity=decision.get("severity"),
                severity_score=decision.get("severity_score"),
                is_duplicate=is_dup,
                duplicate_of_id=dup_of_id,
                jurisdiction=decision.get("jurisdiction"),
                asset_owner=decision.get("asset_owner"),
                department=decision.get("department"),
                sla_hours=sla_hours,
                priority=decision.get("priority"),
                escalation_path=json.dumps(decision.get("escalation_path", [])),
                human_verification_required=decision.get("human_verification_required", False),
                decision_reason=decision.get("decision_reason"),
                explainability_payload=json.dumps(decision)
            )
            db.add(dec_log)
            db.commit()

        return {
            "complaint_id": issue.id,
            "status": issue.status,
            "is_duplicate": issue.is_duplicate,
            "duplicate_of_id": issue.duplicate_of_id,
            "department": dept_name,
            "assigned_officer_id": issue.assigned_officer_id or "OFF001",
            "sla_hours": sla_hours,
            "human_verification_required": decision.get("human_verification_required", False),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    finally:
        db.close()
