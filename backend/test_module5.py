import pytest
import requests
import uuid

BASE_URL = "http://localhost:8000/api/v1"

def test_module5_sarvam_ai_suite():
    print("--- RUNNING CIVICPULSE MODULE 5 SARVAM AI AUTOMATED TEST SUITE ---")

    # 1. Register test citizen
    test_email = f"mod5_citizen_{uuid.uuid4().hex[:6]}@example.com"
    res_otp = requests.post(f"{BASE_URL}/auth/request-otp", json={"email": test_email})
    assert res_otp.status_code == 200
    otp_code = res_otp.json()["data"]["demo_otp"]

    res_v = requests.post(f"{BASE_URL}/auth/verify-otp", json={"email": test_email, "otp_code": otp_code})
    assert res_v.status_code == 200

    res_reg = requests.post(f"{BASE_URL}/auth/register-citizen", json={
        "email": test_email,
        "demo_aadhaar_number": "900100001237",
        "preferred_language": "Tamil",
        "password": "Password123"
    })
    assert res_reg.status_code == 200
    token = res_reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASSED] Citizen Auth Token Created for Module 5 Testing.")

    # 2. Test Tamil Text Submission & Translation Pipeline
    res_ta = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "description": "சாலையில் பெரிய பள்ளம் உள்ளது மற்றும் குடிநீர் குழாய் உடைந்துள்ளது.",
        "language": "Tamil",
        "latitude": 13.0827,
        "longitude": 80.2707
    })
    assert res_ta.status_code == 200
    data_ta = res_ta.json()
    assert data_ta["original_language"] == "Tamil"
    assert "original_description" in data_ta and data_ta["original_description"] is not None
    assert "processed_description" in data_ta and "pothole" in data_ta["processed_description"].lower()
    assert data_ta["language_processing_status"] == "COMPLETED"
    print("[PASSED] Test 1: Tamil Native Text Input Translated to English by Sarvam AI Pipeline.")

    # 3. Test Hindi Text Submission Pipeline
    res_hi = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "description": "मुख्य सड़क पर बड़ा गड्ढा है और पानी का रिसाव हो रहा है।",
        "language": "Hindi",
        "latitude": 28.6139,
        "longitude": 77.2090
    })
    assert res_hi.status_code == 200
    data_hi = res_hi.json()
    assert data_hi["original_language"] == "Hindi"
    assert "processed_description" in data_hi and "leakage" in data_hi["processed_description"].lower()
    print("[PASSED] Test 2: Hindi Native Text Input Processed Successfully.")

    # 4. Test Voice Note Submission & Sarvam STT Transcript Generation
    res_voice = requests.post(f"{BASE_URL}/issues/create", headers=headers, json={
        "voice_url": "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
        "language": "Tamil",
        "latitude": 13.0827,
        "longitude": 80.2707
    })
    assert res_voice.status_code == 200
    data_v = res_voice.json()
    assert "voice_transcript" in data_v and data_v["voice_transcript"] is not None
    assert data_v["language_processing_status"] == "COMPLETED"
    print("[PASSED] Test 3: Voice Note Speech-to-Text Transcript Generated via Sarvam AI.")

    # 5. Test Citizen Transcript Correction Endpoint
    issue_id = data_v["id"]
    res_corr = requests.put(f"{BASE_URL}/issues/{issue_id}/transcript", headers=headers, json={
        "corrected_transcript": "சாலையில் பெரிய பள்ளம் சரிசெய்ய வேண்டும் (Citizen Corrected)",
        "corrected_description": "Pothole on the road needs repair urgently (Citizen Corrected)"
    })
    assert res_corr.status_code == 200
    data_corr = res_corr.json()
    assert "Citizen Corrected" in data_corr["voice_transcript"]
    assert "Citizen Corrected" in data_corr["processed_description"]
    print("[PASSED] Test 4: Citizen Manual Transcript Correction Saved Successfully.")

    # 6. Test Reprocess Sarvam Pipeline Endpoint
    res_repr = requests.post(f"{BASE_URL}/issues/{issue_id}/reprocess-sarvam", headers=headers)
    assert res_repr.status_code == 200
    assert res_repr.json()["language_processing_status"] == "COMPLETED"
    print("[PASSED] Test 5: Sarvam AI Reprocess Pipeline Triggered & Passed.")

    print("\nALL MODULE 5 SARVAM AI VOICE & LANGUAGE TEST CASES PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_module5_sarvam_ai_suite()
