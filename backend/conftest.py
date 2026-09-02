import time
import requests
import pytest

BASE_URL = "http://127.0.0.1:8000/api/v1"


@pytest.fixture(scope="module", autouse=True)
def reset_test_db_before_suite():
    """Reset the test DB before each test module.

    Retries a few times in case the server is still starting.
    """
    url = f"{BASE_URL}/internal/reset-tests"
    payload = {"preserve_demo": False}
    max_retries = 6
    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.post(url, json=payload, timeout=5)
            if resp.status_code == 200:
                print("[conftest] Test DB reset successful.")
                return True
            else:
                print(f"[conftest] Reset endpoint returned {resp.status_code}: {resp.text}")
        except requests.exceptions.RequestException as e:
            print(f"[conftest] Reset attempt {attempt} failed: {e}")
        time.sleep(1)

    pytest.skip("Could not reset test DB: internal reset endpoint unreachable")
