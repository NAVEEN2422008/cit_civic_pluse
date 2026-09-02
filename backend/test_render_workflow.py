import pytest
import uuid
from datetime import datetime, timezone
from workflows.models.workflow_models import ComplaintInput
from workflows.tasks.complaint import preprocess_complaint, create_or_update_ticket
from workflows.tasks.ai_analysis import analyze_image, analyze_text, assess_severity
from workflows.tasks.duplicate_detection import detect_duplicate
from workflows.tasks.rules import (
    determine_jurisdiction,
    determine_asset_ownership,
    determine_department,
    calculate_sla,
    determine_escalation
)
from workflows.tasks.decision import decision_fusion
from workflows.tasks.notifications import notify_department, notify_citizen
from workflows.main import civic_complaint_workflow, execute_with_retry
from workflows.services.database import get_workflow_db
from app.models import Issue, WorkflowRun, DecisionLog

print("--- INITIALIZING CIVICPULSE RENDER WORKFLOW TEST SUITE ---")

# 1. Test Preprocess Complaint Task
def test_preprocess_complaint_valid():
    valid_input = {
        "complaint_id": "CP-TEST-101",
        "user_id": "USER-456",
        "description": "Large pothole on highway",
        "image_url": "https://storage.civicpulse.org/pothole.jpg",
        "latitude": 13.0827,
        "longitude": 80.2707
    }
    result = preprocess_complaint(valid_input)
    assert result["complaint_id"] == "CP-TEST-101"
    assert result["latitude"] == 13.0827
    assert result["longitude"] == 80.2707

def test_preprocess_complaint_invalid_coords():
    with pytest.raises(ValueError):
        preprocess_complaint({
            "complaint_id": "CP-TEST-ERR",
            "latitude": 195.0, # Invalid latitude
            "longitude": 80.0
        })

# 2. Test AI Image & Text Analysis Tasks
def test_ai_image_analysis():
    res = analyze_image("https://storage.civicpulse.org/pothole_asphalt.jpg")
    assert res["problem_category"] == "pothole"
    assert res["confidence"] >= 0.85
    assert len(res["detected_objects"]) > 0

def test_ai_text_analysis_multilingual():
    # English
    res_en = analyze_text("Water pipe is leaking heavily near school")
    assert res_en["problem_category"] == "water leakage"
    assert res_en["confidence"] >= 0.85

    # Tamil Regional
    res_ta = analyze_text("சாலையில் பெரிய பள்ளம் உள்ளது")
    assert res_ta["problem_category"] == "pothole"
    assert res_ta["detected_language"] == "Tamil"

# 3. Test Severity Assessment Task
def test_severity_calculation():
    img_res = {"problem_category": "broken streetlight", "confidence": 0.90, "hazard_signals": ["ELECTROCUTION_RISK"]}
    txt_res = {"problem_category": "broken streetlight", "confidence": 0.88, "summary": "Wire sparking"}
    sev = assess_severity(img_res, txt_res, 13.0827, 80.2707)
    assert sev["severity"] == "CRITICAL"
    assert sev["severity_score"] >= 90

# 4. Test Deterministic Rule Engine
def test_rule_engine_pipeline():
    # Jurisdiction
    jur = determine_jurisdiction(13.0827, 80.2707)
    assert "Ward 104" in jur["ward_name"]

    # Asset Ownership
    owner = determine_asset_ownership("pothole", jur)
    assert "Road" in owner["asset_owner"]

    # Department
    dept = determine_department("pothole", owner["asset_owner"])
    assert dept["department_id"] == "HIGHWAYS_ROADS"

    # SLA
    sla = calculate_sla("CRITICAL")
    assert sla["sla_hours"] == 12

    # Escalation
    esc = determine_escalation(dept, jur)
    assert len(esc["escalation_hierarchy"]) >= 4

# 5. Test Decision Fusion & Low-Confidence Human Fallback
def test_decision_fusion_high_confidence():
    preprocessed = {"complaint_id": "CP-1", "latitude": 13.08, "longitude": 80.27}
    img = {"problem_category": "pothole", "confidence": 0.94}
    txt = {"problem_category": "pothole", "confidence": 0.92}
    sev = {"severity": "HIGH", "severity_score": 85, "confidence": 0.90, "reason": "Pothole hazard"}
    dup = {"is_duplicate": False, "similarity_score": 0.1}
    jur = {"ward_name": "Ward 104, Anna Nagar"}
    owner = {"asset_owner": "Municipal Roadways"}
    dept = {"department_name": "Roads & Bridges Department"}
    sla = {"sla_hours": 24}
    esc = {"escalation_hierarchy": ["Field Officer", "Ward Engineer"]}

    decision = decision_fusion(preprocessed, img, txt, sev, dup, jur, owner, dept, sla, esc)
    assert decision["human_verification_required"] is False
    assert decision["priority"] == "HIGH"
    assert decision["ai_confidence"] >= 0.85

def test_decision_fusion_low_confidence_fallback():
    preprocessed = {"complaint_id": "CP-AMBIGUOUS", "latitude": 13.08, "longitude": 80.27}
    img = {"problem_category": "other", "confidence": 0.45}
    txt = {"problem_category": "other", "confidence": 0.50}
    sev = {"severity": "LOW", "severity_score": 25, "confidence": 0.50, "reason": "Unclear issue"}
    dup = {"is_duplicate": False, "similarity_score": 0.0}
    jur = {"ward_name": "Ward General"}
    owner = {"asset_owner": "Municipal Corporation"}
    dept = {"department_name": "General Works Department"}
    sla = {"sla_hours": 72}
    esc = {"escalation_hierarchy": ["Field Officer"]}

    decision = decision_fusion(preprocessed, img, txt, sev, dup, jur, owner, dept, sla, esc)
    # Triggers Human Officer Review
    assert decision["human_verification_required"] is True

# 6. Test Workflow Retry Behavior
def test_task_retry_behavior():
    attempts = 0
    def flaky_task():
        nonlocal attempts
        attempts += 1
        if attempts < 2:
            raise ConnectionError("Temporary network hiccup")
        return "SUCCESS"

    res = execute_with_retry(flaky_task, max_retries=3, initial_delay=0.05)
    assert res == "SUCCESS"
    assert attempts == 2

# 7. Test Notification Resilience
def test_notification_handling():
    ticket = {"complaint_id": "CP-NOTIF-TEST"}
    decision = {"department": "Roads & Bridges", "priority": "HIGH", "sla_hours": 24}
    dept_res = notify_department(ticket, decision)
    cit_res = notify_citizen(ticket, decision)
    assert dept_res["delivered"] is True
    assert cit_res["delivered"] is True

# 8. Complete End-to-End Workflow Execution
def test_end_to_end_civic_complaint_workflow():
    sample_complaint = {
        "complaint_id": f"TN-2026-E2E-{uuid.uuid4().hex[:4].upper()}",
        "user_id": "USER-CITIZEN-001",
        "description": "Large dangerous pothole causing scooter accidents near Anna Nagar tower",
        "image_url": "https://storage.civicpulse.org/pothole_crater_01.jpg",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    result = civic_complaint_workflow(sample_complaint)
    assert result["status"] in ["ROUTED", "MANUAL_REVIEW"]
    assert result["complaint_id"] == sample_complaint["complaint_id"]
    assert "decision" in result
    assert result["decision"]["category"] == "pothole"
    assert "sla_hours" in result["decision"]
    assert result["ticket"]["assigned_officer_id"] is not None

    # Check WorkflowRun and DecisionLog recorded in DB
    db = get_workflow_db()
    try:
        run = db.query(WorkflowRun).filter(WorkflowRun.complaint_id == sample_complaint["complaint_id"]).first()
        assert run is not None
        assert run.progress == 100

        dec_log = db.query(DecisionLog).filter(DecisionLog.complaint_id == sample_complaint["complaint_id"]).first()
        assert dec_log is not None
        assert dec_log.problem_category == "pothole"
    finally:
        db.close()
