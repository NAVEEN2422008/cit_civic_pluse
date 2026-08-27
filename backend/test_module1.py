import requests
import uuid

BASE_URL = "http://localhost:8000/api/v1"

# Generate unique email per test run
random_suffix = uuid.uuid4().hex[:6]
test_email_1 = f"citizen1_{random_suffix}@example.com"
test_email_2 = f"citizen2_{random_suffix}@example.com"
test_email_bad_otp = f"bad_otp_{random_suffix}@example.com"
test_email_rate_limit = f"rate_limit_{random_suffix}@example.com"

def test_1_new_email_unused_identity():
    """Test 1: New email + unused demo identity -> success"""
    # 1. Request OTP
    res_otp = requests.post(f"{BASE_URL}/auth/request-otp", json={"email": test_email_1})
    assert res_otp.status_code == 200
    otp_code = res_otp.json()["data"]["demo_otp"]

    # 2. Verify OTP
    res_verify = requests.post(f"{BASE_URL}/auth/verify-otp", json={"email": test_email_1, "otp_code": otp_code})
    assert res_verify.status_code == 200

    # 3. Check demo identity 900100001234
    res_check = requests.post(f"{BASE_URL}/auth/check-demo-identity", json={"demo_aadhaar_number": "900100001234"})
    assert res_check.status_code == 200
    assert res_check.json()["valid"] == True

    # 4. Register
    res_reg = requests.post(f"{BASE_URL}/auth/register-citizen", json={
        "email": test_email_1,
        "demo_aadhaar_number": "900100001234",
        "preferred_language": "Tamil",
        "password": "Password123"
    })
    assert res_reg.status_code == 200
    data = res_reg.json()
    assert "access_token" in data
    assert data["role"] == "CITIZEN"
    print("\n[PASSED] TEST 1: New email + unused demo identity registered successfully.")

def test_2_existing_email_reject():
    """Test 2: Existing email -> reject duplicate account"""
    res_reg = requests.post(f"{BASE_URL}/auth/register-citizen", json={
        "email": test_email_1,
        "demo_aadhaar_number": "900100001235",
        "preferred_language": "English",
        "password": "Password123"
    })
    assert res_reg.status_code == 400
    assert "already exists" in res_reg.json()["detail"]
    print("[PASSED] TEST 2: Duplicate email registration rejected correctly.")

def test_3_existing_demo_identity_reject():
    """Test 3: Existing demo identity + new email -> reject"""
    res_reg = requests.post(f"{BASE_URL}/auth/register-citizen", json={
        "email": test_email_2,
        "demo_aadhaar_number": "900100001234", # Already registered to test_email_1
        "preferred_language": "Hindi",
        "password": "Password123"
    })
    assert res_reg.status_code == 400
    assert "already been registered" in res_reg.json()["detail"]
    print("[PASSED] TEST 3: Duplicate demo identity registration rejected correctly.")

def test_4_invalid_demo_identity():
    """Test 4: Invalid demo identity -> reject"""
    res_check = requests.post(f"{BASE_URL}/auth/check-demo-identity", json={"demo_aadhaar_number": "111122223333"})
    assert res_check.status_code == 200
    assert res_check.json()["valid"] == False
    print("[PASSED] TEST 4: Non-seeded invalid demo identity rejected correctly.")

def test_5_incorrect_otp():
    """Test 5: Incorrect OTP -> reject"""
    res_otp = requests.post(f"{BASE_URL}/auth/request-otp", json={"email": test_email_bad_otp})
    assert res_otp.status_code == 200

    res_verify = requests.post(f"{BASE_URL}/auth/verify-otp", json={"email": test_email_bad_otp, "otp_code": "000000"})
    assert res_verify.status_code == 400
    assert "Invalid OTP code" in res_verify.json()["detail"]
    print("[PASSED] TEST 5: Incorrect OTP rejected correctly.")

def test_6_multiple_otp_attempts_rate_limit():
    """Test 6: Multiple OTP attempts -> rate limit"""
    res_otp1 = requests.post(f"{BASE_URL}/auth/request-otp", json={"email": test_email_rate_limit})
    assert res_otp1.status_code == 200

    # Request immediately again to trigger 429 rate limit
    res_otp2 = requests.post(f"{BASE_URL}/auth/request-otp", json={"email": test_email_rate_limit})
    assert res_otp2.status_code == 429
    assert "rate limit reached" in res_otp2.json()["detail"]
    print("[PASSED] TEST 6: OTP rate limit enforced correctly (HTTP 429).")

def test_7_expired_jwt():
    """Test 7: Expired / Invalid JWT -> reject"""
    fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.fake"
    res_profile = requests.get(f"{BASE_URL}/users/me", headers={"Authorization": f"Bearer {fake_token}"})
    assert res_profile.status_code == 401
    print("[PASSED] TEST 7: Expired/invalid JWT rejected correctly (HTTP 401).")

def test_8_unauthorized_access_protected_endpoint():
    """Test 8: Unauthorized access to protected endpoint -> reject"""
    res_profile = requests.get(f"{BASE_URL}/users/me")
    assert res_profile.status_code == 403 or res_profile.status_code == 401
    print("[PASSED] TEST 8: Unauthorized request without auth header rejected correctly.")

if __name__ == "__main__":
    print("--- RUNNING CIVICPULSE MODULE 1 AUTOMATED SUITE ---")
    test_1_new_email_unused_identity()
    test_2_existing_email_reject()
    test_3_existing_demo_identity_reject()
    test_4_invalid_demo_identity()
    test_5_incorrect_otp()
    test_6_multiple_otp_attempts_rate_limit()
    test_7_expired_jwt()
    test_8_unauthorized_access_protected_endpoint()
    print("\nALL 8 MODULE 1 TEST CASES PASSED SUCCESSFULLY!")
