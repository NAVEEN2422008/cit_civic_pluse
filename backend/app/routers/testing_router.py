from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    User, MockIdentity, OTPStore, Issue, IssueSupport, WorkflowRun,
    DecisionLog, AuditLog, EscalationRecord, SLAPauseLog, SiteInspection, WorkOrder
)
from app.schemas import StandardResponse

router = APIRouter(prefix="/internal", tags=["Internal Testing"])


@router.post("/reset-tests", response_model=StandardResponse)
def reset_tests_db(preserve_demo: bool = True, db: Session = Depends(get_db)):
    """
    Test-only endpoint to reset application data to a clean state.
    - Removes citizen users, issues, workflow runs, supports, logs, and OTPs.
    - Resets `MockIdentity.is_registered` flags so demo identities are reusable.
    Use only in test environments or locally.
    """
    try:
        # delete dependent tables first
        db.query(IssueSupport).delete()
        db.query(WorkflowRun).delete()
        db.query(DecisionLog).delete()
        db.query(EscalationRecord).delete()
        db.query(SLAPauseLog).delete()
        db.query(SiteInspection).delete()
        db.query(WorkOrder).delete()
        db.query(AuditLog).delete()

        # Clear issues and OTPs
        db.query(Issue).delete()
        db.query(OTPStore).delete()

        # Remove citizen users but keep officers/admins when preserve_demo=True
        if preserve_demo:
            db.query(User).filter(User.role == "CITIZEN").delete()
        else:
            db.query(User).delete()

        # Reset demo identities
        all_ids = db.query(MockIdentity).all()
        for mid in all_ids:
            mid.is_registered = False
            mid.registered_user_id = None

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reset test DB: {e}")

    return StandardResponse(success=True, message="Test DB reset successfully.")
