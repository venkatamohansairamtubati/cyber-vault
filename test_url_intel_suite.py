"""
Forensic URL Intelligence & API Verification Suite for Cyber Vault
Tests:
1. POST /api/url/analyze with standard HTTPS URL, path & query
2. POST /api/url/analyze with DGA / high-entropy domain
3. POST /api/url/analyze with direct public IP & payload extension
4. POST /api/url/analyze with internal/sandboxed scheme (chrome://)
5. Backward-compatibility test: POST /api/extension/scan-url
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.main import app

client = TestClient(app)

def run_tests():
    print("=== CYBER VAULT URL INTELLIGENCE VERIFICATION SUITE ===")

    # Test 1: Standard Benign URL with path & query
    url1 = "https://example.com/login?redirect=/dashboard&session=42#token"
    r1 = client.post("/api/url/analyze", json={"url": url1, "source": "browser_extension"})
    assert r1.status_code == 200, f"Test 1 failed: {r1.status_code}"
    d1 = r1.json()
    assert d1["verdict"] == "BENIGN", f"Expected BENIGN, got {d1['verdict']}"
    assert d1["risk_level"] == "LOW", f"Expected LOW, got {d1['risk_level']}"
    assert d1["risk_score"] < 25, f"Expected risk < 25, got {d1['risk_score']}"
    assert d1["normalized_url"] == url1, f"Expected normalized URL match, got {d1['normalized_url']}"
    assert "explanation" in d1 and len(d1["explanation"]) > 0
    assert len(d1["indicators"]) > 0
    print("[PASS] Test 1: Full URL with path, query, fragment analyzed as BENIGN (Score:", d1["risk_score"], ")")

    # Test 2: DGA & Phishing Heuristics
    url2 = "http://xq9a1z87bb29lmk8.xyz/wallet-connect"
    r2 = client.post("/api/url/analyze", json={"url": url2, "deep_inspect": True})
    assert r2.status_code == 200, f"Test 2 failed: {r2.status_code}"
    d2 = r2.json()
    assert d2["verdict"] in ["SUSPICIOUS", "MALICIOUS"], f"Expected SUSPICIOUS/MALICIOUS, got {d2['verdict']}"
    assert d2["risk_score"] >= 50, f"Expected risk >= 50, got {d2['risk_score']}"
    print("[PASS] Test 2: DGA Phishing correctly flagged as", d2["verdict"], "(Score:", d2["risk_score"], ")")

    # Test 3: Direct Public IP & Executable Payload
    url3 = "http://85.204.116.42:8080/c2_agent.exe"
    r3 = client.post("/api/url/analyze", json={"url": url3, "deep_inspect": True})
    assert r3.status_code == 200, f"Test 3 failed: {r3.status_code}"
    d3 = r3.json()
    assert d3["verdict"] == "MALICIOUS", f"Expected MALICIOUS, got {d3['verdict']}"
    assert d3["risk_level"] == "CRITICAL", f"Expected CRITICAL, got {d3['risk_level']}"
    assert d3["risk_score"] >= 75, f"Expected risk >= 75, got {d3['risk_score']}"
    assert d3["telemetry"]["payload_ext"] == ".exe"
    print("[PASS] Test 3: Direct Public IP & EXE payload flagged as MALICIOUS (Score:", d3["risk_score"], ")")

    # Test 4: Internal privileged context (chrome://extensions)
    url4 = "chrome://extensions/"
    r4 = client.post("/api/url/analyze", json={"url": url4})
    assert r4.status_code == 200, f"Test 4 failed: {r4.status_code}"
    d4 = r4.json()
    assert d4["verdict"] == "BENIGN"
    assert d4["telemetry"]["host_type"] == "Browser Context"
    print("[PASS] Test 4: Internal browser scheme (chrome://) safely handled as sandboxed context.")

    # Test 5: Legacy alias endpoint /api/extension/scan-url
    r5 = client.post("/api/extension/scan-url", json={"url": "https://google.com"})
    assert r5.status_code == 200, f"Test 5 failed: {r5.status_code}"
    d5 = r5.json()
    assert d5["threat_level"] == "SAFE" or d5["verdict"] == "BENIGN"
    print("[PASS] Test 5: Legacy alias /api/extension/scan-url verified.")

    print("\nALL 5 URL THREAT INTELLIGENCE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
