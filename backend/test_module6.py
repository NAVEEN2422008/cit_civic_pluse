import pytest
import requests
import uuid

BASE_URL = "http://localhost:8000/api/v1"

def test_module6_ai_categorization_suite():
    print("--- RUNNING CIVICPULSE MODULE 6 AI ISSUE CATEGORIZATION AUTOMATED SUITE ---")

    # 1. Register test citizen
    test_email = f"mod6_citizen_{uuid.uuid4().hex[:6]}@example.com"
    res_otp = requests.post(f"{BASE_URL}/auth/request-otp", json={"email": test_email})
    assert res_otp.status_code == 200
    otp_code = res_otp.json()["data"]["demo_otp"]

    res_v = requests.post(f"{BASE_URL}/auth/verify-otp", json={"email": test_email, "otp_code": otp_code})
    assert res_v.status_code == 200

    res_reg = requests.post(f"{BASE_URL}/auth/register-citizen", json={
        "email": test_email,
        "demo_aadhaar_number": "900100001237",
        "preferred_language": "English",
        "password": "Password123"
    })
    assert res_reg.status_code == 200
    token = res_reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASSED] Citizen Auth Token Created for Module 6 Testing.")

    # 2. Test Pothole Image + Text Categorization (ROADS / POTHOLE)
    res_pothole = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "description": "Large deep pothole on main road near Anna Nagar junction.",
        "media_url": "data:image/jpeg;base64,pothole_sample_image",
        "latitude": 13.0827,
        "longitude": 80.2707
    })
    assert res_pothole.status_code == 200
    data_p = res_pothole.json()
    assert data_p["ai_category"] == "ROADS"
    assert data_p["ai_issue_type"] == "POTHOLE"
    assert data_p["ai_severity"] == "HIGH"
    assert data_p["ai_confidence"] >= 0.90
    assert data_p["ai_review_status"] == "AUTO_APPROVED"
    print("[PASSED] Test 1: Pothole Defect Categorized as ROADS/POTHOLE (High Severity, Auto Approved).")

    # 3. Test Overflowing Garbage Image Categorization (GARBAGE)
    res_garbage = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "description": "Overflowing garbage bin on street corner.",
        "media_url": "data:image/jpeg;base64,garbage_sample_image",
        "latitude": 13.0827,
        "longitude": 80.2707
    })
    assert res_garbage.status_code == 200
    data_g = res_garbage.json()
    assert data_g["ai_category"] == "GARBAGE"
    assert data_g["ai_issue_type"] == "OVERFLOWING_BIN"
    print("[PASSED] Test 2: Garbage Waste Categorized as GARBAGE/OVERFLOWING_BIN.")

    # 4. Test Streetlight Categorization (STREETLIGHT)
    res_light = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "description": "Broken streetlight pole, dark road.",
        "latitude": 13.0827,
        "longitude": 80.2707
    })
    assert res_light.status_code == 200
    data_l = res_light.json()
    assert data_l["ai_category"] == "STREETLIGHT"
    print("[PASSED] Test 3: Streetlight Defect Categorized as STREETLIGHT.")

    # 5. Test Blocked Drain Categorization (DRAINAGE)
    res_drain = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "description": "Blocked storm water drain causing street waterlogging.",
        "latitude": 13.0827,
        "longitude": 80.2707
    })
    assert res_drain.status_code == 200
    data_d = res_drain.json()
    assert data_d["ai_category"] == "DRAINAGE"
    print("[PASSED] Test 4: Drain Waterlogging Categorized as DRAINAGE.")

    # 6. Test Ambiguous Image / Low Confidence Handling (Forces AI_REVIEW_REQUIRED)
    res_amb = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "description": "Ambiguous blur picture unknown issue",
        "latitude": 13.0827,
        "longitude": 80.2707
    })
    assert res_amb.status_code == 200
    data_a = res_amb.json()
    assert data_a["ai_confidence"] < 0.70
    assert data_a["ai_review_status"] == "AI_REVIEW_REQUIRED"
    print("[PASSED] Test 5: Ambiguous Defect Identified with Low Confidence (<0.70) -> Marked AI_REVIEW_REQUIRED.")

    # 7. Test On-Demand Recategorize Endpoint
    issue_id = data_p["id"]
    res_re = requests.post(f"{BASE_URL}/issues/{issue_id}/recategorize", headers=headers)
    assert res_re.status_code == 200
    assert res_re.json()["ai_category"] == "ROADS"
    print("[PASSED] Test 6: On-Demand Gemini AI Recategorize Endpoint Triggered & Verified.")

    print("\nALL MODULE 6 AI ISSUE CATEGORIZATION TEST CASES PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_module6_ai_categorization_suite()
