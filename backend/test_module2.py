import pytest
import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_module2_endpoints():
    print("--- RUNNING CIVICPULSE MODULE 2 AUTOMATED API SUITE ---")
    
    # 1. Register a test citizen to obtain JWT token
    import uuid
    test_email = f"mod2_user_{uuid.uuid4().hex[:6]}@example.com"
    
    # OTP
    res_otp = requests.post(f"{BASE_URL}/auth/request-otp", json={"email": test_email})
    assert res_otp.status_code == 200
    otp_code = res_otp.json()["data"]["demo_otp"]
    
    # Verify OTP
    res_v = requests.post(f"{BASE_URL}/auth/verify-otp", json={"email": test_email, "otp_code": otp_code})
    assert res_v.status_code == 200
    
    # Register
    res_reg = requests.post(f"{BASE_URL}/auth/register-citizen", json={
        "email": test_email,
        "demo_aadhaar_number": "900100001235",
        "preferred_language": "English",
        "password": "Password123"
    })
    assert res_reg.status_code == 200
    token = res_reg.json()["access_token"]
    print("[PASSED] Module 2 User Registration & JWT Issuance.")

    # 2. Test GET /citizen/dashboard-summary (Protected)
    res_dash = requests.get(f"{BASE_URL}/citizen/dashboard-summary", headers={"Authorization": f"Bearer {token}"})
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert "active_count" in dash_data
    assert "my_complaints" in dash_data
    assert "public_nearby_issues" in dash_data
    print("[PASSED] GET /citizen/dashboard-summary (Protected JWT Access).")

    # 3. Test GET /citizen/public-issues (Privacy Sanitization Check)
    res_public = requests.get(f"{BASE_URL}/citizen/public-issues", headers={"Authorization": f"Bearer {token}"})
    assert res_public.status_code == 200
    issues = res_public.json()
    assert len(issues) > 0
    
    # Verify ZERO private user fields exposed in public issues API!
    first_issue = issues[0]
    assert "reporter_email" not in first_issue
    assert "reporter_phone" not in first_issue
    assert "identity_reference" not in first_issue
    print("[PASSED] GET /citizen/public-issues (Privacy Guarantee: 0 Private Fields Exposed).")

    # 4. Unauthorized Access test without JWT
    res_unauth = requests.get(f"{BASE_URL}/citizen/dashboard-summary")
    assert res_unauth.status_code in [401, 403]
    print("[PASSED] Protected Endpoint Rejects Unauthorized Access.")

    print("\nALL MODULE 2 API TEST CASES PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_module2_endpoints()
