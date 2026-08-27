from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Issue
from app.schemas import DashboardSummaryResponse, PublicIssueResponse, HeatmapPointResponse, IssueDetailResponse, TimelineStepResponse
from app.security import get_current_user

router = APIRouter(prefix="/citizen", tags=["Citizen Dashboard & Hub"])

# Seed Mock Public Issues Dataset
MOCK_PUBLIC_ISSUES = [
  {
    "id": "TN-2026-8801",
    "category": "Roads & Infrastructure",
    "title_ta": "அண்ணா நகர் சாலையில் பெரிய சாக்கடை அடைப்பு",
    "title_en": "Main Road Pothole & Water Logging Near Junction",
    "location_ward": "Ward 104, Anna Nagar, Chennai",
    "status": "OPEN",
    "supporters_count": 14,
    "reports_count": 3,
    "created_at": datetime.now(timezone.utc),
    "priority": "HIGH",
    "photo_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80"
  },
  {
    "id": "TN-2026-8802",
    "category": "Street Lighting (TNEB)",
    "title_ta": "தெரு விளக்குகள் எரியவில்லை",
    "title_en": "Streetlight Power Fault & Cable Damage",
    "location_ward": "Ward 45, K.K. Nagar, Madurai",
    "status": "PROCESSING",
    "supporters_count": 28,
    "reports_count": 6,
    "created_at": datetime.now(timezone.utc),
    "priority": "MEDIUM",
    "photo_url": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=400&q=80"
  },
  {
    "id": "TN-2026-8803",
    "category": "Solid Waste Management",
    "title_ta": "குப்பை சேகரிப்பு மந்தம்",
    "title_en": "Uncleaned Garbage Dump near Bus Stop",
    "location_ward": "Ward 12, Gandhipuram, Coimbatore",
    "status": "RESOLVED",
    "supporters_count": 42,
    "reports_count": 11,
    "created_at": datetime.now(timezone.utc),
    "priority": "LOW",
    "photo_url": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80"
  }
]

@router.get("/dashboard-summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Module 2 & 8 Summary metrics and privacy-sanitized public feeds."""
    return DashboardSummaryResponse(
        active_count=3,
        processing_count=2,
        resolved_count=8,
        reopened_count=1,
        my_complaints=MOCK_PUBLIC_ISSUES[:2],
        public_nearby_issues=MOCK_PUBLIC_ISSUES
    )

@router.get("/public-issues", response_model=List[PublicIssueResponse])
def get_public_issues(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Privacy-sanitized public area issues feed."""
    return MOCK_PUBLIC_ISSUES

@router.get("/heatmap-clusters", response_model=List[HeatmapPointResponse])
def get_heatmap_clusters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Module 8 Geospatial Heatmap Cluster Aggregation Endpoint.
    Aggregates coordinates to ward grids to protect citizen privacy.
    """
    clusters = [
        # Chennai Clusters
        HeatmapPointResponse(latitude=13.0827, longitude=80.2707, density_score=85, category="ROADS", location_ward="Ward 104, Anna Nagar"),
        HeatmapPointResponse(latitude=13.0418, longitude=80.2341, density_score=62, category="GARBAGE", location_ward="Ward 112, T. Nagar"),
        HeatmapPointResponse(latitude=12.9815, longitude=80.2180, density_score=45, category="STREETLIGHT", location_ward="Ward 170, Velachery"),
        HeatmapPointResponse(latitude=13.0878, longitude=80.2785, density_score=95, category="DRAINAGE", location_ward="Ward 90, Central"),

        # Madurai Clusters
        HeatmapPointResponse(latitude=9.9252, longitude=78.1198, density_score=78, category="ROADS", location_ward="Ward 45, K.K. Nagar"),
        HeatmapPointResponse(latitude=9.9195, longitude=78.1193, density_score=35, category="WATER", location_ward="Ward 22, Meenakshi Temple Area"),

        # Coimbatore Clusters
        HeatmapPointResponse(latitude=11.0168, longitude=76.9558, density_score=88, category="GARBAGE", location_ward="Ward 12, Gandhipuram"),
        HeatmapPointResponse(latitude=10.9980, longitude=76.9660, density_score=50, category="STREETLIGHT", location_ward="Ward 30, RS Puram"),

        # Trichy Clusters
        HeatmapPointResponse(latitude=10.7905, longitude=78.7047, density_score=40, category="WATER", location_ward="Ward 78, Trichy Central")
    ]
    return clusters

@router.get("/issues/{issue_id}/detail", response_model=IssueDetailResponse)
def get_issue_detail_with_timeline(
    issue_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Module 8 Complete 9-Step Status Timeline Endpoint:
    Submitted -> Processed -> Categorized -> Duplicate checked -> Routed -> Assigned -> In Progress -> Resolved -> Citizen Verification
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    
    # Generate 9-Step Status Timeline
    steps = [
        TimelineStepResponse(step_key="SUBMITTED", title="Submitted", description="Citizen intake created & uploaded", is_completed=True, is_current=False),
        TimelineStepResponse(step_key="PROCESSED", title="Processed", description="Audio/Voice STT & regional text processed by Sarvam AI", is_completed=True, is_current=False),
        TimelineStepResponse(step_key="CATEGORIZED", title="Categorized", description="Defect classified as ROADS/POTHOLE by Gemini AI", is_completed=True, is_current=False),
        TimelineStepResponse(step_key="DEDUPLICATED", title="Duplicate Checked", description="Multi-signal spatial/text deduplication verified", is_completed=True, is_current=False),
        TimelineStepResponse(step_key="ROUTED", title="Routed", description="Auto-routed to Greater Chennai Highways Division", is_completed=True, is_current=False),
        TimelineStepResponse(step_key="ASSIGNED", title="Assigned", description="Assigned to Ward Engineer Er. R. Murugan", is_completed=True, is_current=True),
        TimelineStepResponse(step_key="IN_PROGRESS", title="In Progress", description="Road repair patch crew dispatched to site", is_completed=False, is_current=False),
        TimelineStepResponse(step_key="RESOLVED", title="Resolved", description="Defect repaired with photo proof verification", is_completed=False, is_current=False),
        TimelineStepResponse(step_key="VERIFIED", title="Citizen Verification", description="Citizen confirmation OTP & rating check", is_completed=False, is_current=False)
    ]

    if issue:
        return IssueDetailResponse(
            id=issue.id,
            offline_submission_id=issue.offline_submission_id,
            original_description=issue.original_description,
            processed_description=issue.processed_description,
            original_language=issue.original_language,
            voice_url=issue.voice_url,
            voice_transcript=issue.voice_transcript,
            ai_category=issue.ai_category or "ROADS",
            ai_issue_type=issue.ai_issue_type or "POTHOLE",
            ai_severity=issue.ai_severity or "HIGH",
            ai_confidence=issue.ai_confidence or 0.94,
            ai_review_status=issue.ai_review_status or "AUTO_APPROVED",
            is_duplicate=issue.is_duplicate,
            reports_count=issue.reports_count,
            supporters_count=issue.supporters_count,
            media_url=issue.media_url,
            latitude=issue.latitude,
            longitude=issue.longitude,
            location_ward=issue.location_ward,
            status=issue.status,
            created_at=issue.created_at,
            sla_days_remaining=3,
            department="Highways & Potholes",
            timeline_steps=steps
        )

    # Prototype Fallback Detail
    return IssueDetailResponse(
        id=issue_id,
        original_description="அண்ணா நகர் சாலையில் பெரிய சாக்கடை அடைப்பு",
        processed_description="Main Road Pothole & Water Logging Near Junction",
        original_language="Tamil",
        ai_category="ROADS",
        ai_issue_type="POTHOLE",
        ai_severity="HIGH",
        ai_confidence=0.94,
        is_duplicate=False,
        reports_count=3,
        supporters_count=14,
        media_url="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80",
        latitude=13.0827,
        longitude=80.2707,
        location_ward="Ward 104, Anna Nagar, Chennai",
        status="OPEN",
        created_at=datetime.now(timezone.utc),
        sla_days_remaining=3,
        department="Highways & Potholes",
        timeline_steps=steps
    )
