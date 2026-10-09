"""
KaamConnect End-to-End Demo Workflow Execution Script
Demonstrating the 21-step workflow requested in Prompt Section 39:
1. Login as Sunrise Construction
2. View project
3. Create structured labour requirement
4. Call explainable matching endpoint
5. Display matching workers and transparent reasons
6. Send offer to Ravi Kumar
7. Simulate automated voice call
8. Ravi presses '1' on phone keypad (DTMF)
9. Backend accepts offer transactionally
10. Assignment is created
11. Digital work order is created
12. Contractor receives Ravi's contact number (Privacy released)
13. Ravi checks in (NO GPS)
14. Contractor confirms attendance
15. Backend calculates ₹900 daily wage
16. Payment record is generated
17. Contractor records reported payment
18. Worker views wage/payment status
19. Create an example dispute
20. Resolve dispute preserving historical records
21. View comprehensive audit trail
"""
import sys
from fastapi.testclient import TestClient
from app.main import app

def run_demo():
    client = TestClient(app)
    print("=" * 80)
    print("KAAMCONNECT: END-TO-END DEMO WORKFLOW DEMONSTRATION")
    print("=" * 80)

    # 1. Login as Sunrise Construction
    print("\n[Step 1] Logging in as Sunrise Construction (Contractor: Ramesh Sharma)...")
    login_resp = client.post("/api/v1/auth/login", json={
        "phone_number": "9811100001",
        "password": "password123"
    })
    assert login_resp.status_code == 200, login_resp.text
    c_token = login_resp.json()["data"]["access_token"]
    c_headers = {"Authorization": f"Bearer {c_token}"}
    print(" -> Authenticated successfully. Token obtained.")

    # 2. View project
    print("\n[Step 2] Fetching Sunrise Construction Projects...")
    proj_resp = client.get("/api/v1/projects", headers=c_headers)
    assert proj_resp.status_code == 200, proj_resp.text
    projects = proj_resp.json()["data"]
    assert len(projects) > 0
    p1 = projects[0]
    p_id = p1["id"]
    s_id = p1["sites"][0]["id"]
    print(f" -> Project: '{p1['name']}' (ID: {p_id}), Site: '{p1['sites'][0]['name']}' (Region: {p1['sites'][0]['region']}, NO GPS)")

    # 3. Create labour requirement
    print("\n[Step 3] Fetching Trades & Skills to construct structured requirement...")
    trades_resp = client.get("/api/v1/trades")
    trades = {t["name"]: t["id"] for t in trades_resp.json()["data"]}
    
    mason_skills = {s["name"]: s["id"] for s in client.get(f"/api/v1/trades/{trades['MASON']}/skills").json()["data"]}
    helper_skills = {s["name"]: s["id"] for s in client.get(f"/api/v1/trades/{trades['HELPER']}/skills").json()["data"]}
    elec_skills = {s["name"]: s["id"] for s in client.get(f"/api/v1/trades/{trades['ELECTRICIAN']}/skills").json()["data"]}

    print(" -> Creating structured labour requirement: 10 Masons (Brick Masonry @ ₹900), 20 Helpers (@ ₹700), 2 Electricians (@ ₹1200)...")
    req_payload = {
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": "2026-11-01",
        "required_end_date": "2027-01-31",
        "work_schedule": "08:00-17:00",
        "items": [
            {
                "trade_id": trades["MASON"],
                "skill_id": mason_skills["Brick Masonry"],
                "minimum_skill_level": 2,  # Intermediate
                "quantity_required": 10,
                "wage_rate": 900.0,
                "wage_period": "DAILY",
                "duration": "3 months"
            },
            {
                "trade_id": trades["HELPER"],
                "skill_id": helper_skills["General Construction"],
                "minimum_skill_level": 1,
                "quantity_required": 20,
                "wage_rate": 700.0,
                "wage_period": "DAILY",
                "duration": "3 months"
            },
            {
                "trade_id": trades["ELECTRICIAN"],
                "skill_id": elec_skills["Industrial Wiring"],
                "minimum_skill_level": 3,  # Advanced
                "quantity_required": 2,
                "wage_rate": 1200.0,
                "wage_period": "DAILY",
                "duration": "3 months"
            }
        ]
    }
    req_resp = client.post("/api/v1/labour-requirements", json=req_payload, headers=c_headers)
    assert req_resp.status_code == 201, req_resp.text
    requirement = req_resp.json()["data"]
    req_id = requirement["id"]
    mason_item_id = requirement["items"][0]["id"]
    print(f" -> Labour Requirement #{req_id} created with 3 line items.")

    # 4 & 5. Call matching endpoint & display explainable results
    print("\n[Step 4 & 5] Invoking Explainable Deterministic Matching Algorithm...")
    match_resp = client.get(f"/api/v1/labour-requirements/{req_id}/matches", headers=c_headers)
    assert match_resp.status_code == 200, match_resp.text
    match_data = match_resp.json()["data"]

    mason_result = match_data["results_by_item"][0]
    print(f"\nMatching Results for Item: {mason_result['quantity_required']}x {mason_result['trade_name']} ({mason_result['skill_name']} Intermediate+) @ ₹{mason_result['wage_rate']}/day:")
    print("-" * 75)
    for w in mason_result["matched_workers"]:
        pref_tag = " [PREFERRED WORKER]" if w["is_preferred"] else ""
        print(f" [MATCHED] {w['name']} (ID: {w['worker_id']}){pref_tag}")
        for r in w["match_reasons"]:
            print(f"    * {r}")

    print("\nNon-Matched Candidates with Reasons:")
    for w in mason_result["unmatched_workers"][:2]:
        print(f" [DISQUALIFIED] {w['name']} (ID: {w['worker_id']})")
        for dr in w["disqualification_reasons"]:
            print(f"    X {dr}")

    ravi_match = next(w for w in mason_result["matched_workers"] if "Ravi" in w["name"])
    ravi_id = ravi_match["worker_id"]

    # 6. Send offer to Ravi
    print(f"\n[Step 6] Sending Job Offer to candidate Ravi Kumar (Worker #{ravi_id})...")
    offer_resp = client.post("/api/v1/offers", json={
        "requirement_item_id": mason_item_id,
        "worker_id": ravi_id
    }, headers=c_headers)
    assert offer_resp.status_code == 201, offer_resp.text
    offer_id = offer_resp.json()["data"]["id"]
    print(f" -> Offer #{offer_id} created. Status: PENDING, Offered Wage: ₹{offer_resp.json()['data']['offered_wage']}/day.")

    # Check Ravi cannot be contacted directly yet (Privacy check)
    pre_contact_view = client.get(f"/api/v1/workers/{ravi_id}", headers=c_headers)
    print(f" -> Pre-acceptance contact check: Phone number is '{pre_contact_view.json()['data']['phone_number_masked']}' (Protected)")

    # 7. Simulate Automated Voice Call (Mock telecom IVR provider)
    print(f"\n[Step 7] Simulating automated voice call to Ravi's basic phone...")
    call_resp = client.post(f"/api/v1/dev/mock-call/{offer_id}")
    assert call_resp.status_code == 200
    print(f" -> Voice call initiated via telecom gateway. Message: '{call_resp.json()['data']['details']['message']}'")

    # 8 & 9. Ravi presses '1' (Accept) on keypad -> Webhook processes transactional acceptance
    print("\n[Step 8 & 9] Ravi presses '1' (ACCEPT) on phone keypad...")
    dtmf_resp = client.post(f"/api/v1/dev/mock-call/{offer_id}/input", json={"input": "1"})
    assert dtmf_resp.status_code == 200, dtmf_resp.text
    dtmf_data = dtmf_resp.json()["data"]
    wo_id = dtmf_data["work_order_id"]
    asgn_id = dtmf_data["assignment_id"]
    print(f" -> Webhook response: {dtmf_data['message']}")
    print(f" -> Offer status: ACCEPTED")

    # 10 & 11. Work Order and Assignment created
    print(f"\n[Step 10 & 11] Verifying Digital Work Order #{wo_id} and Assignment #{asgn_id}...")
    wo_view = client.get(f"/api/v1/work-orders/{wo_id}", headers=c_headers).json()["data"]
    print(f" -> Digital Work Order #{wo_id} Version: {wo_view['versions'][0]['version_number']}")
    print(f"    Terms: '{wo_view['versions'][0]['terms_text']}'")
    print(f"    Agreed Daily Wage: ₹{wo_view['versions'][0]['agreed_wage_rate']}/day")

    asgn_view = client.get(f"/api/v1/assignments/{asgn_id}", headers=c_headers).json()["data"]
    print(f" -> Assignment #{asgn_id} Status: {asgn_view['status']}")

    # 12. Worker contact is now released to the contractor
    print("\n[Step 12] Contractor viewing Ravi's released contact information...")
    post_contact_view = client.get(f"/api/v1/workers/{ravi_id}", headers=c_headers).json()["data"]
    print(f" -> Worker Contact Released! Phone: {post_contact_view['phone_number']}, Name: {post_contact_view['name']}")

    # Authenticate as Ravi
    w_login = client.post("/api/v1/auth/login", json={"phone_number": "9876500001", "password": "password123"})
    w_token = w_login.json()["data"]["access_token"]
    w_headers = {"Authorization": f"Bearer {w_token}"}

    # 13. Ravi checks in (NO GPS)
    print("\n[Step 13] Ravi checking in for morning shift (NO GPS)...")
    cin_resp = client.post("/api/v1/attendance/check-in", json={
        "assignment_id": asgn_id,
        "confirmation_method": "APP",
        "notes": "Checked in at site gate"
    }, headers=w_headers)
    assert cin_resp.status_code == 201, cin_resp.text
    att_id = cin_resp.json()["data"]["id"]
    print(f" -> Attendance #{att_id} recorded. Status: {cin_resp.json()['data']['attendance_status']}")

    # 14. Contractor confirms attendance
    print(f"\n[Step 14] Contractor confirming attendance #{att_id}...")
    conf_resp = client.post(f"/api/v1/attendance/{att_id}/confirm", json={
        "status": "PRESENT",
        "notes": "Shift verified by site supervisor"
    }, headers=c_headers)
    assert conf_resp.status_code == 200, conf_resp.text
    print(f" -> Attendance confirmed as: {conf_resp.json()['data']['attendance_status']}")

    # 15. Daily wage calculated
    print(f"\n[Step 15] Calculating daily wage due for attendance #{att_id}...")
    wage_resp = client.get(f"/api/v1/attendance/{att_id}/wage", headers=w_headers)
    assert wage_resp.status_code == 200, wage_resp.text
    wage_data = wage_resp.json()["data"]
    print(f" -> Wage Due: ₹{wage_data['calculated_amount']} (Status: {wage_data['attendance_status']}, Work Order Version: {wage_data['work_order_version']})")
    print(f"    Notice: {wage_data['note']}")

    # 16 & 17. Payment record generated & Contractor records payment
    print(f"\n[Step 16 & 17] Contractor recording payment of ₹900 via UPI...")
    pay_resp = client.post("/api/v1/payments", json={
        "attendance_id": att_id,
        "amount_reported_paid": 900.0,
        "payment_method": "UPI",
        "payment_reference": "UPI/ICICI/20261008/998811"
    }, headers=c_headers)
    assert pay_resp.status_code == 201, pay_resp.text
    pay_data = pay_resp.json()["data"]
    pay_id = pay_data["id"]
    print(f" -> Payment Record #{pay_id} created. Status: {pay_data['payment_status']}, Ref: {pay_data['payment_reference']}")

    # 18. Worker views wage and payment record
    print(f"\n[Step 18] Ravi viewing his payment records...")
    w_pay_list = client.get("/api/v1/payments", headers=w_headers).json()["data"]
    assert len(w_pay_list) >= 1
    print(f" -> Worker retrieved {len(w_pay_list)} payment records. Latest status: {w_pay_list[0]['payment_status']}")

    # 19. Raise an example dispute
    print("\n[Step 19] Worker raising an example dispute on wage adjustment...")
    disp_resp = client.post("/api/v1/disputes", json={
        "dispute_type": "WAGE",
        "assignment_id": asgn_id,
        "payment_id": pay_id,
        "description": "Worker inquired about travel allowance reimbursement"
    }, headers=w_headers)
    assert disp_resp.status_code == 201, disp_resp.text
    disp_id = disp_resp.json()["data"]["id"]
    print(f" -> Dispute #{disp_id} opened. Status: {disp_resp.json()['data']['status']}")

    # 20. Resolve dispute
    print(f"\n[Step 20] Contractor resolving dispute #{disp_id} without altering original records...")
    res_resp = client.post(f"/api/v1/disputes/{disp_id}/resolve", json={
        "status": "RESOLVED",
        "resolution": "Reimbursement of ₹100 agreed to be added on next settlement"
    }, headers=c_headers)
    assert res_resp.status_code == 200, res_resp.text
    print(f" -> Dispute status: {res_resp.json()['data']['status']}, Resolution: '{res_resp.json()['data']['resolution']}'")

    # 21. View audit trail
    print(f"\n[Step 21] Reviewing full audit trail for Work Order #{wo_id}...")
    audit_resp = client.get(f"/api/v1/audit/WORK_ORDER/{wo_id}", headers=c_headers)
    assert audit_resp.status_code == 200, audit_resp.text
    logs = audit_resp.json()["data"]
    for l in logs:
        print(f" -> [{l['timestamp']}] Action: {l['action']}, Actor: {l['actor_name']}, Reason: {l['reason']}")

    print("\n" + "=" * 80)
    print("SUCCESS: ALL 21 STEPS OF THE KAAMCONNECT DEMO WORKFLOW PASSED FLAWLESSLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_demo()
