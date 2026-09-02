import json
from datetime import datetime, timezone
from workflows.main import civic_complaint_workflow

def run_demo_seeds():
    print("\n=======================================================")
    print("   CIVICPULSE RENDER WORKFLOW: 5 REALISTIC DEMO SEEDS")
    print("=======================================================\n")

    test_cases = [
        {
            "complaint_id": "CP-DEMO-001",
            "user_id": "USER-CITIZEN-001",
            "description": "Large deep pothole on Anna Nagar 2nd Avenue causing severe traffic bottleneck",
            "image_url": "https://storage.civicpulse.org/pothole_crater_01.jpg",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "complaint_id": "CP-DEMO-002",
            "user_id": "USER-CITIZEN-002",
            "description": "Commercial waste bin overflowing with rotting garbage on roadside",
            "image_url": "https://storage.civicpulse.org/garbage_dump_02.jpg",
            "latitude": 13.0418,
            "longitude": 80.2341,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "complaint_id": "CP-DEMO-003",
            "user_id": "USER-CITIZEN-003",
            "description": "Broken streetlight pole with sparking electrical wire after storm",
            "image_url": "https://storage.civicpulse.org/streetlight_broken_03.jpg",
            "latitude": 12.9815,
            "longitude": 80.2180,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "complaint_id": "CP-DEMO-004",
            "user_id": "USER-CITIZEN-004",
            "description": "Main subterranean drinking water distribution pipeline ruptured and leaking clean water",
            "image_url": "https://storage.civicpulse.org/water_pipe_burst_04.jpg",
            "latitude": 13.0067,
            "longitude": 80.2570,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "complaint_id": "CP-DEMO-005",
            "user_id": "USER-CITIZEN-005",
            "description": "Clogged stormwater drainage culvert causing blackwater overflow and localized flooding",
            "image_url": "https://storage.civicpulse.org/drain_blockage_05.jpg",
            "latitude": 11.0168,
            "longitude": 76.9558,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ]

    for case in test_cases:
        print(f"\n--- EXECUTING WORKFLOW FOR: {case['complaint_id']} ---")
        print(f"Problem Input: '{case['description']}'")
        res = civic_complaint_workflow(case)
        dec = res["decision"]
        print(f"-> AI Category: {dec['category']} (Confidence: {dec['ai_confidence']})")
        print(f"-> Severity: {dec['severity']} (Score: {dec['severity_score']})")
        print(f"-> Assigned Department: {dec['department']}")
        print(f"-> Jurisdiction / Ward: {dec['jurisdiction']}")
        print(f"-> Statutory Asset Owner: {dec['asset_owner']}")
        print(f"-> SLA Guaranteed: {dec['sla_hours']} Hours")
        print(f"-> Human Review Required: {dec['human_verification_required']}")
        print(f"-> Final Status: {res['status']}")

if __name__ == "__main__":
    run_demo_seeds()
