import os
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from workflows.models.workflow_models import DecisionFusionResult

logger = logging.getLogger(__name__)

def decision_fusion(
    preprocessed: Dict[str, Any],
    image_result: Optional[Dict[str, Any]],
    text_result: Optional[Dict[str, Any]],
    severity_result: Dict[str, Any],
    duplicate_result: Dict[str, Any],
    jurisdiction_result: Dict[str, Any],
    asset_ownership_result: Dict[str, Any],
    department_result: Dict[str, Any],
    sla_result: Dict[str, Any],
    escalation_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Task 11: decision_fusion
    Core intelligence convergence layer:
      AI Engine (What is the problem?)
      +
      Deterministic Rules (Who is responsible?)
      +
      Duplicate Detection (Has this already been reported?)
      +
      Confidence & Human Verification Fallback
    """
    confidence_threshold = float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.85"))

    img_conf = float(image_result.get("confidence", 0.50)) if image_result else 0.50
    txt_conf = float(text_result.get("confidence", 0.50)) if text_result else 0.50
    sev_conf = float(severity_result.get("confidence", 0.70))

    # Weighted AI Confidence Fusion
    composite_ai_confidence = round((img_conf * 0.40) + (txt_conf * 0.40) + (sev_conf * 0.20), 3)

    # Determine fused problem classification
    img_cat = image_result.get("problem_category") if image_result else None
    txt_cat = text_result.get("problem_category") if text_result else None

    if img_cat and img_conf >= 0.85:
        final_category = img_cat
    elif txt_cat and txt_conf >= 0.80:
        final_category = txt_cat
    elif img_cat and img_cat != "other":
        final_category = img_cat
    else:
        final_category = txt_cat or "other"

    # Human verification trigger (Module 8 Confidence + Human Fallback)
    human_verification = False
    decision_reason_notes = []

    if composite_ai_confidence < confidence_threshold:
        human_verification = True
        decision_reason_notes.append(
            f"Composite AI confidence ({composite_ai_confidence:.2f}) below threshold ({confidence_threshold}). Routed for Human Officer Review."
        )
    else:
        decision_reason_notes.append(
            f"High-confidence automated triage ({composite_ai_confidence:.2f})."
        )

    # Duplicate note
    is_dup = duplicate_result.get("is_duplicate", False)
    dup_id = duplicate_result.get("duplicate_complaint_id")
    if is_dup and dup_id:
        decision_reason_notes.append(
            f"Linked to existing master ticket {dup_id} (Similarity: {duplicate_result.get('similarity_score')})."
        )

    severity_str = severity_result.get("severity", "MEDIUM")
    severity_score = int(severity_result.get("severity_score", 50))
    sla_hours = int(sla_result.get("sla_hours", 48))

    fusion = DecisionFusionResult(
        problem=severity_result.get("reason", f"Identified {final_category}"),
        category=final_category,
        severity=severity_str,
        severity_score=severity_score,
        ai_confidence=composite_ai_confidence,
        duplicate=is_dup,
        duplicate_of_id=dup_id,
        jurisdiction=jurisdiction_result.get("ward_name", "Ward General"),
        asset_owner=asset_ownership_result.get("asset_owner", "Municipal Corporation"),
        department=department_result.get("department_name", "General Works Department"),
        sla_hours=sla_hours,
        priority=severity_str,
        escalation_path=escalation_result.get("escalation_hierarchy", []),
        human_verification_required=human_verification,
        decision_reason=" | ".join(decision_reason_notes),
        timestamp=datetime.now(timezone.utc).isoformat()
    )

    return fusion.model_dump()
