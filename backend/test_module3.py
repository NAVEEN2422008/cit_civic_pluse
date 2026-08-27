import pytest
import requests
import uuid

BASE_URL = "http://localhost:8000/api/v1"

def test_module3_intake_suite():
    print("--- RUNNING CIVICPULSE MODULE 3 INTAKE AUTOMATED API SUITE ---")

    # 1. Register new citizen to obtain JWT token
    test_email = f"mod3_citizen_{uuid.uuid4().hex[:6]}@example.com"
    res_otp = requests.post(f"{BASE_URL}/auth/request-otp", json={"email": test_email})
    assert res_otp.status_code == 200
    otp_code = res_otp.json()["data"]["demo_otp"]

    res_v = requests.post(f"{BASE_URL}/auth/verify-otp", json={"email": test_email, "otp_code": otp_code})
    assert res_v.status_code == 200

    res_reg = requests.post(f"{BASE_URL}/auth/register-citizen", json={
        "email": test_email,
        "demo_aadhaar_number": "900100001236",
        "preferred_language": "Tamil",
        "password": "Password123"
    })
    assert res_reg.status_code == 200
    token = res_reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASSED] Citizen Auth Token Created for Intake Testing.")

    # 2. Test Combination 1: Photo Only
    res_c1 = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "media_url": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "location_source": "EXIF",
        "location_ward": "Ward 104, Anna Nagar"
    })
    assert res_c1.status_code == 200
    data1 = res_c1.json()
    assert data1["id"].startswith("TN-")
    assert data1["media_url"] is not None
    print("[PASSED] Combination 1: Photo Only Complaint Submitted.")

    # 3. Test Combination 2: Text Only
    res_c2 = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "description": "சாலையில் பெரிய பள்ளம் உள்ளது (Deep Pothole)",
        "language": "Tamil",
        "latitude": 9.9252,
        "longitude": 78.1198,
        "location_source": "GPS",
        "location_ward": "Ward 45, Madurai"
    })
    assert res_c2.status_code == 200
    data2 = res_c2.json()
    assert data2["description"] is not None
    print("[PASSED] Combination 2: Text Only Complaint Submitted.")

    # 4. Test Combination 3: Voice Only
    res_c3 = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "voice_url": "data:audio/wav;base64,UklGRiQAAABXQVZF...",
        "latitude": 11.0168,
        "longitude": 76.9558,
        "location_source": "GPS",
        "location_ward": "Ward 12, Coimbatore"
    })
    assert res_c3.status_code == 200
    data3 = res_c3.json()
    assert data3["voice_url"] is not None
    print("[PASSED] Combination 3: Voice Only Complaint Submitted.")

    # 5. Test Combination 4: Photo + Text + Voice (Full Combo)
    res_c4 = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "description": "Drinking water pipe burst near bus stand",
        "language": "English",
        "media_url": "https://images.unsplash.com/photo-1584467735871-8e85353a8413",
        "voice_url": "data:audio/wav;base64,UklGRiQAAABXQVZF...",
        "latitude": 10.7905,
        "longitude": 78.7047,
        "location_source": "GPS",
        "location_ward": "Ward 78, Trichy"
    })
    assert res_c4.status_code == 200
    print("[PASSED] Combination 4: Photo + Text + Voice Full Complaint Submitted.")

    # 6. Test Validation: Empty Submission Rejection
    res_empty = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "latitude": 13.0827,
        "longitude": 80.2707,
        "location_source": "GPS"
    })
    assert res_empty.status_code == 400
    assert "must contain at least" in res_empty.json()["detail"]
    print("[PASSED] Empty Submission Rejected (HTTP 400).")

    # 7. Test Security Validation: Text Length Limit (>2000 chars) Rejection
    res_long = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "description": "A" * 2550,
        "latitude": 13.0827,
        "longitude": 80.2707
    })
    assert res_long.status_code == 400
    assert "exceeds maximum limit" in res_long.json()["detail"]
    print("[PASSED] Oversized Text Length Rejected (HTTP 400).")

    print("\nALL MODULE 3 INTAKE TEST CASES PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_module3_intake_suite()
