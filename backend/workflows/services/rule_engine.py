import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from workflows.models.workflow_models import (
    JurisdictionResult,
    AssetOwnershipResult,
    DepartmentResult,
    SLAResult,
    EscalationResult,
    RuleEngineResult
)

# Deterministic SLA Policies (Hours based on priority)
SLA_HOURS_POLICY = {
    "CRITICAL": 12,   # 12 hours for life-safety emergencies
    "HIGH": 24,       # 24 hours for major road and water line disruptions
    "MEDIUM": 48,     # 48 hours for lighting and sanitation
    "LOW": 72         # 72 hours for cosmetic repairs
}

# Known Administrative Wards in Tamil Nadu / Chennai Pilot
WARD_ZONES = [
    {"ward_id": "WARD_104", "ward_name": "Ward 104, Anna Nagar", "zone": "Zone 8 (Central)", "center_lat": 13.0827, "center_lon": 80.2707},
    {"ward_id": "WARD_112", "ward_name": "Ward 112, T. Nagar", "zone": "Zone 10 (South)", "center_lat": 13.0418, "center_lon": 80.2341},
    {"ward_id": "WARD_170", "ward_name": "Ward 170, Velachery", "zone": "Zone 13 (South-East)", "center_lat": 12.9815, "center_lon": 80.2180},
    {"ward_id": "WARD_175", "ward_name": "Ward 175, Adyar", "zone": "Zone 13 (Coastal)", "center_lat": 13.0067, "center_lon": 80.2570},
    {"ward_id": "WARD_045", "ward_name": "Ward 45, K.K. Nagar, Madurai", "zone": "Madurai North", "center_lat": 9.9252, "center_lon": 78.1198},
    {"ward_id": "WARD_014", "ward_name": "Ward 14, Gandhipuram, Coimbatore", "zone": "Coimbatore Central", "center_lat": 11.0168, "center_lon": 76.9558}
]

class RuleEngine:
    """
    Deterministic Governance Rule Engine.
    Resolves: GPS -> Ward -> Asset Owner -> Department -> SLA -> Escalation Ladder.
    Does NOT use generative AI for administrative ownership decisions.
    """

    def determine_jurisdiction(self, latitude: float, longitude: float) -> JurisdictionResult:
        """Finds closest administrative ward boundary using spatial Euclidean/Haversine minimum."""
        best_ward = WARD_ZONES[0]
        min_dist = float('inf')

        for w in WARD_ZONES:
            d = (latitude - w["center_lat"])**2 + (longitude - w["center_lon"])**2
            if d < min_dist:
                min_dist = d
                best_ward = w

        return JurisdictionResult(
            ward_id=best_ward["ward_id"],
            ward_name=best_ward["ward_name"],
            zone_id=best_ward["zone"],
            city="Chennai" if "Chennai" in best_ward["ward_name"] else best_ward["ward_name"].split(",")[-1].strip(),
            municipality="Greater Chennai Corporation" if "Chennai" in best_ward["ward_name"] else "Municipal Corporation"
        )

    def determine_asset_ownership(self, problem_category: str, jurisdiction: JurisdictionResult) -> AssetOwnershipResult:
        """Resolves legal statutory asset owner based on civic asset class."""
        cat = (problem_category or "").lower()

        if "pothole" in cat or "road" in cat:
            # National / State Highway vs Municipal Corporation Street
            return AssetOwnershipResult(
                asset_type="Asphalt Roadway Infrastructure",
                asset_owner="Municipal Corporation Road Maintenance Division"
            )
        elif "streetlight" in cat or "lighting" in cat or "electric" in cat:
            return AssetOwnershipResult(
                asset_type="Public Luminaire & High-Mast Illumination Grid",
                asset_owner="Tamil Nadu Electricity Board (TNEB) & Municipal Lighting Cell"
            )
        elif "water" in cat or "potable" in cat:
            return AssetOwnershipResult(
                asset_type="Potable Water Distribution Mainlines",
                asset_owner="Chennai Metro Water Supply and Sewerage Board (CMWSSB)"
            )
        elif "drain" in cat or "sewage" in cat:
            return AssetOwnershipResult(
                asset_type="Stormwater Underground Drainage Network",
                asset_owner="Metropolitan Stormwater Drainage Authority"
            )
        elif "garbage" in cat or "waste" in cat:
            return AssetOwnershipResult(
                asset_type="Solid Waste Management Infrastructure",
                asset_owner="Municipal Solid Waste & Public Hygiene Department"
            )
        else:
            return AssetOwnershipResult(
                asset_type="Public Municipal Right-of-Way",
                asset_owner="Greater Chennai Corporation"
            )

    def determine_department(self, problem_category: str, asset_owner: str) -> DepartmentResult:
        """Maps problem and asset ownership to the exact operational department and on-duty field officer."""
        cat = (problem_category or "").lower()

        if "pothole" in cat or "road" in cat:
            return DepartmentResult(
                department_id="HIGHWAYS_ROADS",
                department_name="Roads & Bridges Department",
                officer_id="OFF001"
            )
        elif "garbage" in cat or "waste" in cat:
            return DepartmentResult(
                department_id="SOLID_WASTE",
                department_name="Sanitation & Solid Waste Management",
                officer_id="OFF002"
            )
        elif "streetlight" in cat or "light" in cat:
            return DepartmentResult(
                department_id="ELECTRICAL",
                department_name="Electrical & Public Lighting Division",
                officer_id="OFF003"
            )
        elif "water" in cat:
            return DepartmentResult(
                department_id="WATER_SUPPLY",
                department_name="Water Supply & Sewage Operations (CMWSSB)",
                officer_id="OFF004"
            )
        elif "drain" in cat:
            return DepartmentResult(
                department_id="STORM_DRAINAGE",
                department_name="Stormwater Drainage & Flood Mitigation",
                officer_id="OFF005"
            )
        else:
            return DepartmentResult(
                department_id="GENERAL_MAINTENANCE",
                department_name="General Municipal Works Department",
                officer_id="OFF001"
            )

    def calculate_sla(self, priority: str, start_time: Optional[datetime] = None) -> SLAResult:
        """Calculates SLA duration and target deadline based on priority."""
        if not start_time:
            start_time = datetime.now(timezone.utc)

        p = (priority or "MEDIUM").upper()
        hours = SLA_HOURS_POLICY.get(p, 48)
        deadline = start_time + timedelta(hours=hours)

        return SLAResult(
            sla_hours=hours,
            deadline=deadline,
            policy_code=f"SLA-POL-{p}-{hours}H"
        )

    def determine_escalation(self, department: DepartmentResult, jurisdiction: JurisdictionResult) -> EscalationResult:
        """Constructs the deterministic escalation hierarchy based on administrative levels."""
        hierarchy = [
            f"Field Officer ({department.department_name})",
            f"Ward Junior Engineer ({jurisdiction.ward_name})",
            f"Zonal Executive Officer ({jurisdiction.zone_id})",
            "Superintending City Engineer",
            "Municipal Commissioner / CEO"
        ]
        return EscalationResult(escalation_hierarchy=hierarchy)

    def evaluate_rules(
        self,
        problem_category: str,
        latitude: float,
        longitude: float,
        priority: str
    ) -> RuleEngineResult:
        """Executes full rule chain in one deterministic evaluation."""
        jurisdiction = self.determine_jurisdiction(latitude, longitude)
        ownership = self.determine_asset_ownership(problem_category, jurisdiction)
        dept = self.determine_department(problem_category, ownership.asset_owner)
        sla = self.calculate_sla(priority)
        escalation = self.determine_escalation(dept, jurisdiction)

        return RuleEngineResult(
            jurisdiction=jurisdiction.ward_name,
            asset_owner=ownership.asset_owner,
            department=dept.department_name,
            sla_hours=sla.sla_hours,
            escalation_path=escalation.escalation_hierarchy
        )

# Factory singleton
rule_engine = RuleEngine()
