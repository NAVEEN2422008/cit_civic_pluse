from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Issue, IssueSupport
from app.schemas import IssueCreateRequest, IssueResponse, TranscriptCorrectionRequest, ReopenRequest, PublicVerifyVoteRequest, StandardResponse
from app.security import get_current_user, log_audit_event
from app.services.sarvam_service import sarvam_service
from app.services.categorization_service import categorization_service
from app.services.deduplication_service import deduplication_engine
from app.services.verification_service import verification_service
from app.services.abuse_protection_service import abuse_protection_service
from app.services.file_security_service import file_security_service
from app.services.deduplication_service import haversine_distance_meters

router = APIRouter(prefix="/issues", tags=["Civic Issues Intake & Resolution"])

def run_sarvam_and_ai_categorization_pipelines(issue: Issue, db: Session):
    """Executes Sarvam AI Voice STT/Translation & Gemini Multimodal AI Categorization Pipelines."""
    try:
        orig_text = issue.original_description or issue.description or ""
        voice_url = issue.voice_url
        lang = issue.original_language or "Tamil"

        voice_transcript = None
        processed_text = orig_text

        # 1. Voice STT Pipeline
        if voice_url:
            voice_transcript, _ = sarvam_service.speech_to_text(voice_url, language=lang)
            issue.voice_transcript = voice_transcript

        # 2. Text Translation Pipeline
        text_to_translate = orig_text if orig_text else (voice_transcript if voice_transcript else "")
        if text_to_translate:
            if lang != "English":
                processed_text = sarvam_service.translate_text(text_to_translate, source_language=lang)
            else:
                processed_text = text_to_translate

        issue.processed_description = processed_text
        issue.description = processed_text
        issue.language_processing_status = "COMPLETED"

        # 3. Module 6 Gemini AI Categorization Pipeline
        ai_res = categorization_service.categorize_issue(
            image_url=issue.media_url,
            text_description=processed_text,
            voice_transcript=voice_transcript,
            location_ward=issue.location_ward
        )

        issue.ai_category = ai_res["category"]
        issue.ai_issue_type = ai_res["issue_type"]
        issue.ai_severity = ai_res["severity"]
        issue.ai_confidence = ai_res["confidence"]
        issue.ai_reason = ai_res["reason"]
        issue.ai_processed_at = datetime.now(timezone.utc)
        issue.ai_model_name = "gemini-2.5-flash"
        
        if ai_res["confidence"] < 0.70:
            issue.ai_review_status = "AI_REVIEW_REQUIRED"
        else:
            issue.ai_review_status = "AUTO_APPROVED"

        db.commit()
        db.refresh(issue)

        # 4. Module 7 Multi-Signal Duplicate Detection Evaluation
        deduplication_engine.evaluate_and_link_duplicate(issue, db)

    except Exception as e:
        issue.language_processing_status = "FAILED"
        db.commit()
        db.refresh(issue)

@router.post("/create", response_model=IssueResponse)
def create_issue(
    payload: IssueCreateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Module 3, 4, 5, 6, 7 & 10 Intake Endpoint."""
    if payload.offline_submission_id and payload.offline_submission_id.strip():
        existing = db.query(Issue).filter(Issue.offline_submission_id == payload.offline_submission_id.strip()).first()
        if existing:
            return existing

    # File Security & Magic Byte Header Validation
    if payload.media_url:
        file_security_service.validate_base64_media(payload.media_url)
    if payload.voice_url:
        file_security_service.validate_base64_media(payload.voice_url)

    has_photo = bool(payload.media_url and payload.media_url.strip())
    has_text = bool(payload.description and payload.description.strip())
    has_voice = bool(payload.voice_url and payload.voice_url.strip())

    if not (has_photo or has_text or has_voice):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint must contain at least a Photo, Text Description, or Voice recording."
        )

    if payload.description and len(payload.description) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text description exceeds maximum limit of 2000 characters."
        )

    if not (-90.0 <= payload.latitude <= 90.0 and -180.0 <= payload.longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GPS location coordinates."
        )

    raw_description = payload.description.strip() if payload.description else None
    orig_lang = payload.language or current_user.preferred_language or "English"

    # Module 10 Anti-Spam & Abuse Score Calculator
    abuse_eval = abuse_protection_service.calculate_spam_and_abuse_score(raw_description or "")
    review_status = "AUTO_APPROVED"
    if abuse_eval["spam_score"] > 0.60 or abuse_eval["abuse_score"] > 0.60:
        review_status = "SPAM_SUSPECTED"

    new_issue = Issue(
        offline_submission_id=payload.offline_submission_id.strip() if payload.offline_submission_id else None,
        reporter_id=current_user.id,
        original_description=raw_description,
        description=raw_description,
        original_language=orig_lang,
        language=orig_lang,
        processing_language="English",
        media_url=payload.media_url.strip() if payload.media_url else None,
        voice_url=payload.voice_url.strip() if payload.voice_url else None,
        latitude=payload.latitude,
        longitude=payload.longitude,
        location_source=payload.location_source,
        location_accuracy=payload.location_accuracy,
        location_ward=payload.location_ward or "Ward General, Chennai",
        status="OPEN",
        sync_status="SYNCED",
        language_processing_status="PENDING",
        ai_review_status=review_status,
        spam_score=abuse_eval["spam_score"],
        abuse_score=abuse_eval["abuse_score"],
        is_duplicate=False,
        reports_count=1,
        supporters_count=1
    )

    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)

    run_sarvam_and_ai_categorization_pipelines(new_issue, db)

    log_audit_event(
        db,
        event_type="ISSUE_CREATED",
        user_id=current_user.id,
        details=f"Issue {new_issue.id} created.",
        ip_address=request.client.host
    )

    return new_issue

# --- MODULE 10 PUBLIC SUPPORT ABUSE ENDPOINT ---

@router.post("/{issue_id}/support", response_model=StandardResponse)
def support_public_issue(
    issue_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Public Support Action. Prevents one account/device from repeatedly supporting the same issue.
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    existing_support = db.query(IssueSupport).filter(
        IssueSupport.issue_id == issue_id,
        IssueSupport.user_id == current_user.id
    ).first()

    if existing_support:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already supported this complaint. Duplicate votes from the same account are not permitted."
        )

    new_support = IssueSupport(issue_id=issue_id, user_id=current_user.id)
    db.add(new_support)

    issue.supporters_count += 1
    db.commit()

    log_audit_event(
        db,
        event_type="PUBLIC_SUPPORT_ADDED",
        user_id=current_user.id,
        details=f"User supported issue {issue_id}.",
        ip_address=request.client.host
    )

    return StandardResponse(success=True, message="Your support for this issue has been recorded.")

# --- MODULE 9 RESOLUTION & VERIFICATION ENDPOINTS ---

@router.post("/{issue_id}/confirm-resolution", response_model=IssueResponse)
def confirm_resolution(
    issue_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Citizen confirms resolution -> Sets citizen_confirmation_status = CONFIRMED & status = CLOSED."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    issue.citizen_confirmation_status = "CONFIRMED"
    issue.status = "CLOSED"
    issue.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(issue)

    log_audit_event(
        db,
        event_type="RESOLUTION_CONFIRMED",
        user_id=current_user.id,
        details=f"Citizen confirmed resolution for {issue.id}. Status moved to CLOSED.",
        ip_address=request.client.host
    )

    return issue

@router.post("/{issue_id}/reopen", response_model=IssueResponse)
def reopen_issue(
    issue_id: str,
    payload: ReopenRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Citizen reopens resolved complaint. Requires mandatory reason & proof photo.
    Runs AI verification scoring.
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    if not payload.reason or len(payload.reason.strip()) < 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reopen reason is mandatory (min 5 chars).")

    if not payload.proof_photo or len(payload.proof_photo.strip()) < 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Proof photo image evidence is mandatory to reopen.")

    # Execute AI Reopen Proof Verification
    ai_verify = verification_service.verify_reopen_evidence(
        before_photo=issue.media_url,
        officer_after_photo=issue.resolution_after_photo,
        reopen_proof_photo=payload.proof_photo,
        reopen_reason=payload.reason
    )

    issue.citizen_confirmation_status = "REOPENED"
    issue.status = "REOPEN_REQUESTED"
    issue.reopen_reason = payload.reason.strip()
    issue.reopen_proof_photo = payload.proof_photo.strip()
    issue.verification_score = ai_verify["verification_score"]
    issue.verification_reason = ai_verify["verification_reason"]
    issue.verification_status = ai_verify["verification_status"]
    issue.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(issue)

    log_audit_event(
        db,
        event_type="ISSUE_REOPENED",
        user_id=current_user.id,
        details=f"Issue {issue.id} reopened by citizen (AI Score: {issue.verification_score}).",
        ip_address=request.client.host
    )

    return issue

@router.post("/{issue_id}/trigger-15day-rule", response_model=IssueResponse)
def trigger_15day_rule(
    issue_id: str,
    db: Session = Depends(get_db)
):
    """Simulates 15-day inactivity rule -> Transition to PUBLIC_VERIFICATION_AVAILABLE."""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    issue.public_verification_eligible = True
    issue.status = "PUBLIC_VERIFICATION_AVAILABLE"
    db.commit()
    db.refresh(issue)
    return issue

@router.post("/{issue_id}/public-verify", response_model=StandardResponse)
def public_verify_vote(
    issue_id: str,
    payload: PublicVerifyVoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Public verification vote by verified nearby citizens.
    Guards: verified identity + geographic proximity check (<= 2 km).
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    if not current_user.identity_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only verified Aadhaar identity citizens can vote.")

    dist = haversine_distance_meters(payload.latitude, payload.longitude, issue.latitude, issue.longitude)
    if dist > 2000.0: # 2 km limit
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be within 2 km geographic proximity to participate in public verification.")

    if payload.vote == "CONFIRM":
        issue.supporters_count += 1
        db.commit()

    return StandardResponse(success=True, message=f"Public verification vote ({payload.vote}) recorded successfully.")
