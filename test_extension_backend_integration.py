"""
Test suite to verify that the existing FastAPI backend supports both the existing Web App
and the new Cyber Vault Browser Extension clients seamlessly.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure root is in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.main import app

client = TestClient(app)

def test_health():
    print("\n--- 1. Testing GET /api/health ---")
    resp = client.get("/api/health")
    assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
    data = resp.json()
    print("Health Status:", data.get("status"))
    print("Service:", data.get("service"))
    print("Registered Models:", list(data.get("models_registry", {}).keys()))
    print("[PASS] Health endpoint verified.")

def test_extension_scan_safe():
    print("\n--- 2. Testing POST /api/extension/scan-url (Safe URL) ---")
    resp = client.post("/api/extension/scan-url", json={"url": "https://google.com", "deep_inspect": False})
    assert resp.status_code == 200, f"Scan failed: {resp.status_code}"
    data = resp.json()
    print(f"URL: {data['url']} | Risk: {data['risk_score']} | Level: {data['threat_level']}")
    assert data["threat_level"] == "SAFE", f"Expected SAFE, got {data['threat_level']}"
    print("[PASS] Safe URL scan verified.")

def test_extension_scan_phishing_dga():
    print("\n--- 3. Testing POST /api/extension/scan-url (DGA / Phishing) ---")
    resp = client.post("/api/extension/scan-url", json={"url": "http://xq9a1z87bb29lmk8.xyz/wallet-connect", "deep_inspect": True})
    assert resp.status_code == 200, f"Scan failed: {resp.status_code}"
    data = resp.json()
    print(f"URL: {data['url']} | Risk: {data['risk_score']} | Level: {data['threat_level']}")
    print("Indicators:", data["threat_indicators"])
    print("MITRE ATT&CK:", [m.get("technique") for m in data.get("mitre_techniques", [])])
    assert data["threat_level"] in ["SUSPICIOUS", "MALICIOUS"], f"Expected SUSPICIOUS or MALICIOUS, got {data['threat_level']}"
    assert len(data["threat_indicators"]) > 0, "Expected indicators to be detected"
    print("[PASS] DGA/Phishing heuristic scan verified.")

def test_extension_scan_direct_ip_payload():
    print("\n--- 4. Testing POST /api/extension/scan-url (Direct IP & Payload) ---")
    resp = client.post("/api/extension/scan-url", json={"url": "http://85.204.116.42:8080/c2_agent.exe", "deep_inspect": True})
    assert resp.status_code == 200, f"Scan failed: {resp.status_code}"
    data = resp.json()
    print(f"URL: {data['url']} | Risk: {data['risk_score']} | Level: {data['threat_level']}")
    print("Payload Ext:", data.get("detected_payload_ext"))
    print("Indicators:", data["threat_indicators"])
    assert data["threat_level"] == "MALICIOUS", f"Expected MALICIOUS, got {data['threat_level']}"
    assert data["detected_payload_ext"] == ".exe", f"Expected .exe payload, got {data.get('detected_payload_ext')}"
    print("[PASS] Malicious direct IP + executable payload scan verified.")

def test_file_malware_analysis():
    print("\n--- 5. Testing POST /api/malware/analyze (File Analysis) ---")
    test_bytes = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00" + b"A" * 1024
    files = {"file": ("test_agent.exe", test_bytes, "application/x-dsexec")}
    resp = client.post("/api/malware/analyze", files=files)
    assert resp.status_code == 200, f"Analysis failed: {resp.status_code}"
    data = resp.json()
    print("File ID:", data.get("file_id"))
    print("SHA-256:", data.get("sha256"))
    print("Detected Category / Type:", data.get("file_type", data.get("category")))
    print("Pipeline / Model:", data.get("recommended_model", data.get("pipeline")))
    assert "sha256" in data, "Expected sha256 in response"
    print("[PASS] File malware analysis endpoint verified.")

if __name__ == "__main__":
    test_health()
    test_extension_scan_safe()
    test_extension_scan_phishing_dga()
    test_extension_scan_direct_ip_payload()
    test_file_malware_analysis()
    print("\n=======================================================")
    print(" ALL 5 BACKEND & EXTENSION INTEGRATION TESTS PASSED! ")
    print("=======================================================")
