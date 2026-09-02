import os
import sys
import json
import time
import uuid
import logging
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor

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
from workflows.services.database import get_workflow_db
from app.models import WorkflowRun, Issue

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("civic_complaint_workflow")

class WorkflowExecutionError(Exception):
    """Raised when a non-recoverable workflow failure occurs."""
    pass

def execute_with_retry(task_func, *args, max_retries=3, initial_delay=1.0, **kwargs):
    """Executes a task with exponential backoff for network/transient resilience."""
    last_err = None
    delay = initial_delay
    for attempt in range(1, max_retries + 1):
        try:
            return task_func(*args, **kwargs)
        except (ValueError, TypeError) as non_retryable:
            # Deterministic argument/validation errors should NOT be retried
            raise non_retryable
        except Exception as e:
            last_err = e
            logger.warning(f"Task {task_func.__name__} attempt {attempt}/{max_retries} failed: {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2
    raise last_err

def update_workflow_run_progress(
    run_id: str,
    status: str,
    step: str,
    progress: int,
    task_results: Optional[Dict[str, Any]] = None,
    error_msg: Optional[str] = None
):
    """Updates database record for live progress tracking endpoint."""
    db = get_workflow_db()
    try:
        run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
        if run:
            run.status = status
            run.current_step = step
            run.progress = progress
            if error_msg:
                run.error_message = error_msg
            if task_results:
                existing = json.loads(run.task_results or "{}")
                existing.update(task_results)
                run.task_results = json.dumps(existing)
            if progress >= 100 or status in ["ROUTED", "MANUAL_REVIEW", "FAILED"]:
                run.completed_at = datetime.now(timezone.utc)
            db.commit()
    except Exception as e:
        logger.error(f"Error recording workflow progress: {e}")
    finally:
        db.close()

def civic_complaint_workflow(complaint_input: Dict[str, Any], workflow_run_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Render Workflow: civic_complaint_workflow
    
    Orchestrates the 14 civic intelligence tasks:
      1. preprocess_complaint
      2. analyze_image (parallel with 3)
      3. analyze_text (parallel with 2)
      4. assess_severity (parallel with 5)
      5. detect_duplicate (parallel with 4)
      6. determine_jurisdiction
      7. determine_asset_ownership
      8. determine_department
      9. calculate_sla
      10. determine_escalation
      11. decision_fusion
      12. create_or_update_ticket
      13. notify_department (parallel with 14)
      14. notify_citizen (parallel with 13)
    """
    start_time = datetime.now(timezone.utc)
    complaint_id = complaint_input.get("complaint_id", f"CP-{uuid.uuid4().hex[:6].upper()}")
    
    if not workflow_run_id:
        workflow_run_id = f"wf-{uuid.uuid4().hex[:8]}"

    # Initialize WorkflowRun record in DB
    db = get_workflow_db()
    try:
        existing_run = db.query(WorkflowRun).filter(WorkflowRun.id == workflow_run_id).first()
        if not existing_run:
            run_rec = WorkflowRun(
                id=workflow_run_id,
                workflow_name="civic_complaint_workflow",
                complaint_id=complaint_id,
                status="RECEIVED",
                current_step="preprocess_complaint",
                progress=5,
                started_at=start_time
            )
            db.add(run_rec)
            db.commit()
    finally:
        db.close()

    logger.info(f"[{workflow_run_id}] Starting civic_complaint_workflow for {complaint_id}")

    try:
        # STEP 1: Preprocess Complaint
        update_workflow_run_progress(workflow_run_id, "PROCESSING", "preprocess_complaint", 10)
        preprocessed = preprocess_complaint(complaint_input)

        # STEP 2 & 3: Parallel AI Analysis (Image + Text)
        update_workflow_run_progress(workflow_run_id, "AI_ANALYSIS", "parallel_ai_analysis", 25)
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_img = executor.submit(
                execute_with_retry, analyze_image, preprocessed.get("image_url")
            )
            future_txt = executor.submit(
                execute_with_retry, analyze_text, preprocessed.get("description"), preprocessed.get("voice_transcript")
            )
            img_result = future_img.result()
            txt_result = future_txt.result()

        update_workflow_run_progress(
            workflow_run_id, "AI_ANALYSIS", "ai_analysis_completed", 45,
            {"image_analysis": img_result, "text_analysis": txt_result}
        )

        # Preliminary Category for Duplicate and Routing
        tentative_category = (
            img_result.get("problem_category") if img_result and img_result.get("confidence", 0) >= 0.85 
            else txt_result.get("problem_category", "other")
        )

        # STEP 4 & 5: Parallel Severity Assessment + Duplicate Detection
        update_workflow_run_progress(workflow_run_id, "DUPLICATE_CHECK", "severity_and_duplicate", 55)
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_sev = executor.submit(
                assess_severity, img_result, txt_result, preprocessed["latitude"], preprocessed["longitude"]
            )
            future_dup = executor.submit(
                detect_duplicate,
                complaint_id,
                tentative_category,
                preprocessed["latitude"],
                preprocessed["longitude"],
                preprocessed.get("description"),
                preprocessed.get("image_url")
            )
            sev_result = future_sev.result()
            dup_result = future_dup.result()

        update_workflow_run_progress(
            workflow_run_id, "RULE_EVALUATION", "rule_evaluation", 65,
            {"severity": sev_result, "duplicate": dup_result}
        )

        # STEP 6 - 10: Deterministic Rule Engine
        priority = sev_result.get("severity", "MEDIUM")
        jurisdiction_result = determine_jurisdiction(preprocessed["latitude"], preprocessed["longitude"])
        asset_owner_result = determine_asset_ownership(tentative_category, jurisdiction_result)
        department_result = determine_department(tentative_category, asset_owner_result["asset_owner"])
        sla_result = calculate_sla(priority)
        escalation_result = determine_escalation(department_result, jurisdiction_result)

        update_workflow_run_progress(
            workflow_run_id, "RULE_EVALUATION", "rule_evaluation_completed", 75,
            {
                "jurisdiction": jurisdiction_result,
                "asset_owner": asset_owner_result,
                "department": department_result,
                "sla": sla_result,
                "escalation": escalation_result
            }
        )

        # STEP 11: Decision Fusion
        update_workflow_run_progress(workflow_run_id, "DECISION_READY", "decision_fusion", 85)
        decision = decision_fusion(
            preprocessed=preprocessed,
            image_result=img_result,
            text_result=txt_result,
            severity_result=sev_result,
            duplicate_result=dup_result,
            jurisdiction_result=jurisdiction_result,
            asset_ownership_result=asset_owner_result,
            department_result=department_result,
            sla_result=sla_result,
            escalation_result=escalation_result
        )

        # STEP 12: Ticket Creation / Idempotent DB Commit
        update_workflow_run_progress(
            workflow_run_id, "ROUTED", "create_or_update_ticket", 90,
            {"decision_fusion": decision}
        )
        ticket_result = create_or_update_ticket(preprocessed, decision, workflow_run_id)

        # STEP 13 & 14: Parallel Notifications (Department + Citizen)
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_dept_notif = executor.submit(notify_department, ticket_result, decision)
            future_cit_notif = executor.submit(notify_citizen, ticket_result, decision)
            dept_notif = future_dept_notif.result()
            cit_notif = future_cit_notif.result()

        final_status = "MANUAL_REVIEW" if decision.get("human_verification_required") else "ROUTED"

        update_workflow_run_progress(
            workflow_run_id, final_status, "completed", 100,
            {
                "ticket": ticket_result,
                "department_notification": dept_notif,
                "citizen_notification": cit_notif
            }
        )

        logger.info(f"[{workflow_run_id}] Workflow completed successfully: Status={final_status}, Dept={decision.get('department')}")

        return {
            "workflow_run_id": workflow_run_id,
            "complaint_id": complaint_id,
            "status": final_status,
            "decision": decision,
            "ticket": ticket_result,
            "execution_time_seconds": round((datetime.now(timezone.utc) - start_time).total_seconds(), 2)
        }

    except Exception as e:
        logger.error(f"[{workflow_run_id}] Workflow execution failed: {e}", exc_info=True)
        update_workflow_run_progress(workflow_run_id, "FAILED", "failed", 100, error_msg=str(e))
        raise WorkflowExecutionError(str(e))

if __name__ == "__main__":
    # Test CLI invocation
    sample = {
        "complaint_id": "CP-DEMO-001",
        "user_id": "USER-999",
        "description": "Large deep pothole on Anna Nagar 2nd Avenue causing accidents",
        "image_url": "https://example.com/pothole.jpg",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    print("Testing local execution of civic_complaint_workflow...")
    res = civic_complaint_workflow(sample)
    print(json.dumps(res, indent=2))
