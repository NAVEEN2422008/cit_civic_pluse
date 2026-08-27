from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Issue, SiteInspection, WorkOrder, AuditLog
from app.schemas import (
    AcceptTaskRequest, SiteInspectionRequest, BudgetApprovalRequest,
    BudgetDecisionRequest, CreateWorkOrderRequest, UpdateWorkProgressRequest,
    ResolutionEvidenceRequest, StandardResponse
)
from app.security import get_current_user, require_roles, log_audit_event

router = APIRouter(prefix="/officer", tags=["Officer Portal Operations"])

def log_officer_action(db: Session, officer: User, action: str, issue_id: str, prev_status: str, new_status: str, notes: str = None):
    """Creates a strict audit log entry for every officer action."""
    audit = AuditLog(
        user_id=officer.id,
        officer_id=officer.officer_id or officer.id,
        event_type="OFFICER_ACTION",
        action=action,
        previous_status=prev_status,
        new_status=new_status,
        details=f"Issue {issue_id}: {action} (From '{prev_status}' -> '{new_status}')",
        notes=notes
    )
    db.add(audit)
    db.commit()

# 1. GET OFFICER DASHBOARD METRICS & ASSIGNED COMPLAINTS
@router.get("/dashboard", response_model=StandardResponse)
def get_officer_dashboard(
    current_user: User = Depends(require_roles(["OFFICER", "SUPERVISOR", "ADMIN"])),
    db: Session = Depends(get_db)
):
    """Retrieves Officer operational workspace cards and assigned complaints list."""
    query = db.query(Issue)
    if current_user.role == "OFFICER":
        # Filter by department or assigned officer
        query = query.filter(Issue.assigned_officer_id == current_user.id)
    
    issues = query.all()
    
    # Calculate operational metrics
    new_assignments = sum(1 for i in issues if i.workflow_state in ["ASSIGNED", "ACCEPTED"])
    high_priority = sum(1 for i in issues if i.ai_severity in ["HIGH", "CRITICAL"])
    in_progress = sum(1 for i in issues if i.workflow_state in ["IN_PROGRESS", "WORK_ORDER_CREATED"])
    overdue = sum(1 for i in issues if i.sla_deadline and i.sla_deadline < datetime.now(timezone.utc))
    sla_nearing = sum(1 for i in issues if i.sla_deadline and datetime.now(timezone.utc) <= i.sla_deadline <= datetime.now(timezone.utc) + timedelta(days=2))
    completed = sum(1 for i in issues if i.workflow_state in ["WORK_COMPLETED", "EVIDENCE_UPLOADED", "CLOSED"])

    formatted_issues = []
    for issue in issues:
        # Calculate automatic escalation display status
        esc_status = "None"
        if issue.sla_deadline:
            if issue.sla_deadline < datetime.now(timezone.utc):
                esc_status = "Breached (Supervisor Notified)"
            elif issue.sla_deadline <= datetime.now(timezone.utc) + timedelta(days=2):
                esc_status = "Warning (2 Days Remaining)"

        formatted_issues.append({
            "id": issue.id,
            "category": issue.ai_category or "Civic Infrastructure",
            "issue_type": issue.ai_issue_type or "General Defect",
            "original_description": issue.original_description or issue.description,
            "processed_description": issue.processed_description or issue.description,
            "latitude": issue.latitude,
            "longitude": issue.longitude,
            "location_ward": issue.location_ward,
            "photo_url": issue.media_url or "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
            "priority": issue.ai_severity or "MEDIUM",
            "reports_count": issue.reports_count,
            "supporters_count": issue.supporters_count,
            "is_duplicate": issue.is_duplicate,
            "ai_confidence": issue.ai_confidence or 0.92,
            "workflow_state": issue.workflow_state,
            "budget_status": issue.budget_status,
            "estimated_cost": issue.estimated_cost,
            "available_budget": issue.available_department_budget,
            "sla_deadline": issue.sla_deadline.isoformat() if issue.sla_deadline else (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "escalation_display": esc_status,
            "created_at": issue.created_at.isoformat()
        })

    return StandardResponse(
        success=True,
        message="Officer dashboard loaded successfully.",
        data={
            "officer_info": {
                "officer_id": current_user.officer_id or "OFF001",
                "name": current_user.name or "Municipal Officer",
                "designation": current_user.designation or "Assistant Engineer",
                "department": current_user.department_id or "HIGHWAYS",
                "role": current_user.role
            },
            "summary_cards": {
                "new_assignments": new_assignments,
                "high_priority": high_priority,
                "in_progress": in_progress,
                "sla_nearing_deadline": sla_nearing,
                "overdue": overdue,
                "completed": completed
            },
            "assigned_complaints": formatted_issues
        }
    )

# 2. ACCEPT TASK
@router.post("/issues/{issue_id}/accept", response_model=StandardResponse)
def accept_task(
    issue_id: str,
    payload: AcceptTaskRequest,
    current_user: User = Depends(require_roles(["OFFICER", "SUPERVISOR", "ADMIN"])),
    db: Session = Depends(get_db)
):
    """Officer accepts assigned task."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    prev = issue.workflow_state
    issue.workflow_state = "ACCEPTED"
    db.commit()
    
    log_officer_action(db, current_user, "ACCEPT_TASK", issue.id, prev, "ACCEPTED", payload.notes)
    
    return StandardResponse(success=True, message=f"Task {issue_id} accepted successfully.")

# 3. SUBMIT SITE INSPECTION
@router.post("/issues/{issue_id}/submit-inspection", response_model=StandardResponse)
def submit_site_inspection(
    issue_id: str,
    payload: SiteInspectionRequest,
    current_user: User = Depends(require_roles(["OFFICER", "SUPERVISOR", "ADMIN"])),
    db: Session = Depends(get_db)
):
    """Officer submits site inspection report."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    inspection = SiteInspection(
        issue_id=issue.id,
        officer_id=current_user.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        site_photo_url=payload.site_photo_url,
        problem_condition=payload.problem_condition,
        severity=payload.severity,
        dimensions=payload.dimensions,
        safety_risk=payload.safety_risk,
        required_materials=payload.required_materials,
        required_manpower=payload.required_manpower,
        preliminary_estimate=payload.preliminary_estimate,
        inspection_notes=payload.inspection_notes,
        recommended_action=payload.recommended_action
    )
    db.add(inspection)
    
    prev = issue.workflow_state
    issue.workflow_state = "SITE_INSPECTION"
    issue.estimated_cost = payload.preliminary_estimate
    
    if payload.preliminary_estimate > 20000.0:
        issue.budget_status = "BUDGET_CHECK_REQUIRED"
    db.commit()

    log_officer_action(db, current_user, "SITE_INSPECTION_SUBMITTED", issue.id, prev, "SITE_INSPECTION", payload.inspection_notes)

    return StandardResponse(success=True, message="Site inspection report recorded successfully.", data={"inspection_id": inspection.id})

# 4. REQUEST BUDGET / FUND APPROVAL
@router.post("/issues/{issue_id}/request-budget", response_model=StandardResponse)
def request_budget_approval(
    issue_id: str,
    payload: BudgetApprovalRequest,
    current_user: User = Depends(require_roles(["OFFICER", "SUPERVISOR", "ADMIN"])),
    db: Session = Depends(get_db)
):
    """Officer submits a funding/approval request."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    prev_budget = issue.budget_status
    issue.estimated_cost = payload.estimated_cost
    issue.budget_status = "AWAITING_APPROVAL"
    issue.workflow_state = "APPROVAL_PENDING"
    issue.budget_approval_notes = payload.reason
    db.commit()

    log_officer_action(db, current_user, "BUDGET_REQUEST_SUBMITTED", issue.id, prev_budget, "AWAITING_APPROVAL", payload.reason)

    return StandardResponse(success=True, message="Budget request submitted for Supervisor review.")

# 5. DECIDE BUDGET (SUPERVISOR / ADMIN ONLY — NO SELF APPROVAL)
@router.post("/issues/{issue_id}/decide-budget", response_model=StandardResponse)
def decide_budget(
    issue_id: str,
    payload: BudgetDecisionRequest,
    current_user: User = Depends(require_roles(["SUPERVISOR", "ADMIN"])),
    db: Session = Depends(get_db)
):
    """Supervisor/Admin approves or rejects funding request. Self-approval is blocked."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    if issue.assigned_officer_id == current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Self-Approval Violation: Officers cannot approve their own funding requests. Require Supervisor authorization.")

    prev_budget = issue.budget_status
    if payload.approved:
        if issue.estimated_cost > issue.available_department_budget:
            issue.budget_status = "FUNDS_UNAVAILABLE"
            db.commit()
            raise HTTPException(status_code=400, detail="Insufficient department budget available.")
        
        issue.budget_status = "APPROVED"
        issue.available_department_budget -= issue.estimated_cost
        issue.workflow_state = "WORK_ORDER_CREATED"
    else:
        issue.budget_status = "REJECTED"
        issue.workflow_state = "ACTION_REQUIRED"
        
    db.commit()

    log_officer_action(db, current_user, "BUDGET_DECISION", issue.id, prev_budget, issue.budget_status, payload.notes)

    return StandardResponse(success=True, message=f"Budget decision recorded: {issue.budget_status}")

# 6. CREATE WORK ORDER
@router.post("/issues/{issue_id}/create-work-order", response_model=StandardResponse)
def create_work_order(
    issue_id: str,
    payload: CreateWorkOrderRequest,
    current_user: User = Depends(require_roles(["OFFICER", "SUPERVISOR", "ADMIN"])),
    db: Session = Depends(get_db)
):
    """Officer creates a formal Work Order for field execution."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    deadline = datetime.now(timezone.utc) + timedelta(days=payload.deadline_days)

    work_order = WorkOrder(
        issue_id=issue.id,
        created_by_officer_id=current_user.id,
        work_description=payload.work_description,
        materials=payload.materials,
        manpower=payload.manpower,
        estimated_cost=payload.estimated_cost,
        assigned_team=payload.assigned_team,
        deadline=deadline,
        priority=payload.priority,
        status="ASSIGNED"
    )
    db.add(work_order)
    
    prev = issue.workflow_state
    issue.workflow_state = "WORK_ORDER_CREATED"
    db.commit()

    log_officer_action(db, current_user, "WORK_ORDER_CREATED", issue.id, prev, "WORK_ORDER_CREATED", payload.work_description)

    return StandardResponse(success=True, message="Work order created successfully.", data={"work_order_id": work_order.id})

# 7. UPDATE WORK PROGRESS
@router.post("/issues/{issue_id}/update-progress", response_model=StandardResponse)
def update_work_progress(
    issue_id: str,
    payload: UpdateWorkProgressRequest,
    current_user: User = Depends(require_roles(["OFFICER", "SUPERVISOR", "ADMIN"])),
    db: Session = Depends(get_db)
):
    """Updates status to IN_PROGRESS, PAUSED, or COMPLETED."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    prev = issue.workflow_state
    if payload.status == "IN_PROGRESS":
        issue.workflow_state = "IN_PROGRESS"
    elif payload.status == "COMPLETED":
        issue.workflow_state = "WORK_COMPLETED"

    db.commit()

    log_officer_action(db, current_user, "WORK_PROGRESS_UPDATE", issue.id, prev, issue.workflow_state, payload.notes)

    return StandardResponse(success=True, message=f"Work status updated to {payload.status}")

# 8. SUBMIT RESOLUTION EVIDENCE (BEFORE/AFTER PHOTOS)
@router.post("/issues/{issue_id}/submit-evidence", response_model=StandardResponse)
def submit_resolution_evidence(
    issue_id: str,
    payload: ResolutionEvidenceRequest,
    current_user: User = Depends(require_roles(["OFFICER", "SUPERVISOR", "ADMIN"])),
    db: Session = Depends(get_db)
):
    """Uploads completion evidence and moves ticket to WAITING_FOR_CITIZEN_VERIFICATION."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    prev = issue.workflow_state
    issue.resolution_after_photo = payload.after_photo_url
    issue.resolution_notes = payload.completion_notes
    issue.completion_latitude = payload.completion_latitude
    issue.completion_longitude = payload.completion_longitude
    issue.resolved_at = datetime.now(timezone.utc)
    
    # Transition workflow state to verification without closing immediately
    issue.workflow_state = "WAITING_FOR_CITIZEN_VERIFICATION"
    issue.status = "PENDING_CONFIRMATION"
    db.commit()

    log_officer_action(db, current_user, "EVIDENCE_SUBMITTED", issue.id, prev, "WAITING_FOR_CITIZEN_VERIFICATION", payload.completion_notes)

    return StandardResponse(
        success=True,
        message="Resolution evidence uploaded successfully. Issue submitted for Citizen Verification."
    )
