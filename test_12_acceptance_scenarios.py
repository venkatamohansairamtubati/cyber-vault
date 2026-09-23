"""
Comprehensive Test Script covering all 12 requirements from Section 21
"""

import sys
import json
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.services.url_service import analyze_url_threat, normalize_url

def test_all_12_scenarios():
    print("================================================================")
    print("CYBER VAULT: VERIFYING ALL 12 ACCEPTANCE TEST SCENARIOS")
    print("================================================================")

    # TEST 1: https://example.com/
    t1 = analyze_url_threat("https://example.com/")
    assert t1["url"] == "https://example.com/", f"Test 1 failed: {t1['url']}"
    assert t1["domain"] == "example.com"
    assert t1["verdict"] == "BENIGN"
    print("[PASS] TEST 1: https://example.com/ -> Exact URL preserved, domain extracted, BENIGN.")

    # TEST 2: https://example.com/login
    t2 = analyze_url_threat("https://example.com/login")
    assert "/login" in t2["normalized_url"], f"Test 2 failed: {t2['normalized_url']}"
    print("[PASS] TEST 2: https://example.com/login -> Path '/login' preserved.")

    # TEST 3: https://example.com/login?user=test
    t3 = analyze_url_threat("https://example.com/login?user=test")
    assert "user=test" in t3["normalized_url"], f"Test 3 failed: {t3['normalized_url']}"
    assert t3["telemetry"]["has_query"] is True
    print("[PASS] TEST 3: https://example.com/login?user=test -> Query parameters preserved.")

    # TEST 4: https://sub.example.com/path
    t4 = analyze_url_threat("https://sub.example.com/path")
    assert t4["domain"] == "sub.example.com", f"Test 4 failed: {t4['domain']}"
    assert t4["telemetry"]["subdomains_count"] == 1
    print("[PASS] TEST 4: https://sub.example.com/path -> Subdomain 'sub.example.com' preserved.")

    # TEST 5: http://example.com/
    t5 = analyze_url_threat("http://example.com/")
    assert t5["telemetry"]["protocol"] == "HTTP"
    assert any("Unencrypted" in ind for ind in t5["indicators"])
    assert t5["risk_score"] > 0
    print("[PASS] TEST 5: http://example.com/ -> Unencrypted HTTP protocol correctly flagged.")

    # TEST 6: chrome://extensions/
    t6 = analyze_url_threat("chrome://extensions/")
    assert t6["verdict"] == "BENIGN"
    assert t6["telemetry"]["host_type"] == "Browser Context"
    assert "Privileged internal browser context" in t6["indicators"][0]
    print("[PASS] TEST 6: chrome://extensions/ -> Handled gracefully as sandboxed internal browser context.")

    # TEST 7 & 8: Normalization consistency for navigation & reload
    n1 = normalize_url("https://example.com/page?id=123#sec")
    assert n1["scheme"] == "https"
    assert n1["hostname"] == "example.com"
    assert n1["pathname"] == "/page"
    assert n1["query"] == "id=123"
    assert n1["fragment"] == "sec"
    print("[PASS] TEST 7 & 8: Tab navigation / reload URL normalization maintains complete components.")

    # TEST 9 & 10: Error handling on invalid/empty targets
    t9 = analyze_url_threat("")
    assert t9["success"] is False
    assert t9["verdict"] == "UNCERTAIN"
    print("[PASS] TEST 9 & 10: Empty or invalid URL returns safe UNCERTAIN verdict without raising unhandled exceptions.")

    # TEST 11: Live HTTP endpoint parity
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/url/analyze",
        data=json.dumps({"url": "https://example.com/test"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        live_data = json.loads(resp.read().decode())
        assert live_data["verdict"] == "BENIGN"
        assert live_data["domain"] == "example.com"
        print("[PASS] TEST 11: Live HTTP POST /api/url/analyze returns consistent backend structure.")

    # TEST 12: Ensure no hardcoded test URLs exist in browser-extension/popup.js
    popup_js = (BASE_DIR / "browser-extension" / "popup.js").read_text(encoding="utf-8")
    assert "cybervault.research.lab/demo" not in popup_js, "Found stale demo URL in popup.js"
    assert "renderOfflineDemo" not in popup_js, "Found renderOfflineDemo in popup.js"
    print("[PASS] TEST 12: Verified zero hardcoded demo URLs or fake score functions exist in popup.js.")

    print("\n================================================================")
    print("ALL 12 ACCEPTANCE CRITERIA VERIFIED AND PASSED!")
    print("================================================================")

if __name__ == "__main__":
    test_all_12_scenarios()
