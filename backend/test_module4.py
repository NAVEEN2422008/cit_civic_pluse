import pytest
import requests
import uuid

BASE_URL = "http://localhost:8000/api/v1"

def test_module4_offline_sync_suite():
    print("--- RUNNING CIVICPULSE MODULE 4 OFFLINE QUEUE & SYNC AUTOMATED API SUITE ---")

    # 1. Register test citizen
    test_email = f"mod4_citizen_{uuid.uuid4().hex[:6]}@example.com"
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
    print("[PASSED] Citizen Auth Token Created for Module 4 Testing.")

    # 2. Test Normal Online Submission with offline_submission_id
    offline_id_1 = f"OFFLINE-TEST-{uuid.uuid4().hex[:8]}"
    res_sync1 = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "offline_submission_id": offline_id_1,
        "description": "Synced Complaint 1",
        "language": "English",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "location_source": "GPS",
        "location_ward": "Ward 104, Anna Nagar"
    })
    assert res_sync1.status_code == 200
    data1 = res_sync1.json()
    assert data1["offline_submission_id"] == offline_id_1
    print("[PASSED] Test 1 & 4: Offline Complaint Uploaded & Confirmed by Server.")

    # 3. Test Idempotent Duplicate Sync Prevention
    res_sync_dup = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "offline_submission_id": offline_id_1, # Duplicate submission of same offline ID
        "description": "Duplicate Attempt",
        "latitude": 13.0827,
        "longitude": 80.2707
    })
    assert res_sync_dup.status_code == 200
    data_dup = res_sync_dup.json()
    assert data_dup["id"] == data1["id"] # Must return same issue ID without creating duplicate entry!
    print("[PASSED] Test 7: Duplicate Sync Prevention Enforced (Idempotent DB check).")

    # 4. Test Multiple Offline Complaints Queued & Uploaded Together
    offline_id_2 = f"OFFLINE-BATCH-{uuid.uuid4().hex[:8]}"
    offline_id_3 = f"OFFLINE-BATCH-{uuid.uuid4().hex[:8]}"

    res_b2 = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "offline_submission_id": offline_id_2,
        "description": "Batch Queued Complaint 2",
        "latitude": 9.9252,
        "longitude": 78.1198
    })
    res_b3 = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "offline_submission_id": offline_id_3,
        "description": "Batch Queued Complaint 3",
        "latitude": 11.0168,
        "longitude": 76.9558
    })

    assert res_b2.status_code == 200 and res_b3.status_code == 200
    print("[PASSED] Test 8: Multiple Offline Complaints Queued and Uploaded Together.")

    print("\nALL MODULE 4 OFFLINE QUEUE & AUTOMATIC SYNC TEST CASES PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_module4_offline_sync_suite()
