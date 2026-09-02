import logging
from typing import Dict, Any
from workflows.services.rule_engine import rule_engine
from workflows.models.workflow_models import (
    JurisdictionResult,
    AssetOwnershipResult,
    DepartmentResult,
    SLAResult,
    EscalationResult
)

logger = logging.getLogger(__name__)

def determine_jurisdiction(latitude: float, longitude: float) -> Dict[str, Any]:
    """Task 6: determine_jurisdiction (GPS -> Ward / Zone)"""
    res: JurisdictionResult = rule_engine.determine_jurisdiction(latitude, longitude)
    return res.model_dump()

def determine_asset_ownership(problem_category: str, jurisdiction: Dict[str, Any]) -> Dict[str, Any]:
    """Task 7: determine_asset_ownership (Defect Category -> Statutory Asset Owner)"""
    jur_model = JurisdictionResult(**jurisdiction)
    res: AssetOwnershipResult = rule_engine.determine_asset_ownership(problem_category, jur_model)
    return res.model_dump()

def determine_department(problem_category: str, asset_owner: str) -> Dict[str, Any]:
    """Task 8: determine_department (Category + Asset Owner -> Department & Field Officer)"""
    res: DepartmentResult = rule_engine.determine_department(problem_category, asset_owner)
    return res.model_dump()

def calculate_sla(priority: str) -> Dict[str, Any]:
    """Task 9: calculate_sla (Priority -> Hours & Resolution Deadline)"""
    res: SLAResult = rule_engine.calculate_sla(priority)
    data = res.model_dump()
    data["deadline"] = res.deadline.isoformat()
    return data

def determine_escalation(department: Dict[str, Any], jurisdiction: Dict[str, Any]) -> Dict[str, Any]:
    """Task 10: determine_escalation (Department + Ward -> Escalation Hierarchy)"""
    dept_model = DepartmentResult(**department)
    jur_model = JurisdictionResult(**jurisdiction)
    res: EscalationResult = rule_engine.determine_escalation(dept_model, jur_model)
    return res.model_dump()
