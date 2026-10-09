import pytest
from datetime import date, timedelta
from app.models.trade_skill import Trade, Skill, SkillLevel, VerificationStatus
from app.models.offer import OfferStatus
from app.models.work_order import WorkOrderStatus
from app.models.assignment import AssignmentStatus
from app.models.attendance import AttendanceStatus
from app.models.payment import PaymentStatus

# Helper function to register and authenticate
def register_and_login(client, name: str, phone: str, role: str, password: str = "pass123"):
    reg_resp = client.post("/api/v1/auth/register", json={
        "name": name,
        "phone_number": phone,
        "password": password,
        "role": role
    })
    assert reg_resp.status_code == 201, reg_resp.text

    login_resp = client.post("/api/v1/auth/login", json={
        "phone_number": phone,
        "password": password
    })
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["data"]["access_token"]
    user_id = login_resp.json()["data"]["user_id"]
    return {"token": token, "user_id": user_id, "headers": {"Authorization": f"Bearer {token}"}}

def setup_trades_and_skills(db):
    # Idempotent setup for Mason and Electrician trades and skills
    t_mason = db.query(Trade).filter(Trade.name == "MASON").first()
    if not t_mason:
        t_mason = Trade(name="MASON", description="Masonry trade")
        db.add(t_mason)

    t_elec = db.query(Trade).filter(Trade.name == "ELECTRICIAN").first()
    if not t_elec:
        t_elec = Trade(name="ELECTRICIAN", description="Electrical trade")
        db.add(t_elec)
    db.flush()

    s_brick = db.query(Skill).filter(Skill.trade_id == t_mason.id, Skill.name == "Brick Masonry").first()
    if not s_brick:
        s_brick = Skill(trade_id=t_mason.id, name="Brick Masonry", description="Bricklaying")
        db.add(s_brick)

    s_wiring = db.query(Skill).filter(Skill.trade_id == t_elec.id, Skill.name == "Industrial Wiring").first()
    if not s_wiring:
        s_wiring = Skill(trade_id=t_elec.id, name="Industrial Wiring", description="Wiring")
        db.add(s_wiring)

    db.commit()
    return t_mason, t_elec, s_brick, s_wiring


# TEST 1: Create worker
def test_1_create_worker(client, db):
    setup_trades_and_skills(db)
    w_auth = register_and_login(client, "Ravi Worker", "9800000001", "WORKER")

    resp = client.post("/api/v1/workers", json={
        "preferred_language": "hi",
        "home_region": "Patna",
        "current_work_region": "Delhi NCR",
        "expected_daily_wage": 850.0
    }, headers=w_auth["headers"])

    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["name"] == "Ravi Worker"
    assert data["availability_status"] == "AVAILABLE"
    assert data["expected_daily_wage"] == 850.0


# TEST 2: Create contractor
def test_2_create_contractor(client):
    c_auth = register_and_login(client, "Ramesh Contractor", "9800000002", "CONTRACTOR")

    resp = client.post("/api/v1/contractors", json={
        "company_name": "Sunrise Construction",
        "contact_person": "Ramesh Contractor"
    }, headers=c_auth["headers"])

    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["company_name"] == "Sunrise Construction"


# TEST 3: Create project
def test_3_create_project(client):
    c_auth = register_and_login(client, "Project Builder", "9800000003", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Builder Ltd", "contact_person": "Builder"}, headers=c_auth["headers"])

    resp = client.post("/api/v1/projects", json={
        "name": "Sunrise Apartment Project",
        "description": "12 Towers",
        "start_date": str(date.today()),
        "expected_end_date": str(date.today() + timedelta(days=90))
    }, headers=c_auth["headers"])

    assert resp.status_code == 201
    assert resp.json()["data"]["name"] == "Sunrise Apartment Project"


# TEST 4: Create site
def test_4_create_site(client):
    c_auth = register_and_login(client, "Site Builder", "9800000004", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Site Ltd", "contact_person": "SiteBuilder"}, headers=c_auth["headers"])
    p_resp = client.post("/api/v1/projects", json={
        "name": "Site Project",
        "start_date": str(date.today())
    }, headers=c_auth["headers"])
    p_id = p_resp.json()["data"]["id"]

    resp = client.post(f"/api/v1/projects/{p_id}/sites", json={
        "name": "Sunrise Site A",
        "address": "Sector 62",
        "region": "Delhi NCR"
    }, headers=c_auth["headers"])

    assert resp.status_code == 201
    assert resp.json()["data"]["name"] == "Sunrise Site A"
    assert resp.json()["data"]["region"] == "Delhi NCR"


# TEST 5: Create labour requirement
def test_5_create_labour_requirement(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    c_auth = register_and_login(client, "Req Contractor", "9800000005", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Req Infra", "contact_person": "RC"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Tower A", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "Site 1", "address": "Road 1", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]

    resp = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=60)),
        "work_schedule": "08:00-17:00",
        "items": [
            {
                "trade_id": t_mason.id,
                "skill_id": s_brick.id,
                "minimum_skill_level": 2,  # Intermediate
                "quantity_required": 10,
                "wage_rate": 900.0,
                "wage_period": "DAILY"
            }
        ]
    }, headers=c_auth["headers"])

    assert resp.status_code == 201
    data = resp.json()["data"]
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity_required"] == 10
    assert data["items"][0]["wage_rate"] == 900.0


# TEST 6: Matching finds correct workers
def test_6_matching_finds_correct_workers(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)

    # Worker 1: Ravi (Mason, Brick Masonry, Advanced level 3)
    w_auth = register_and_login(client, "Ravi Kumar", "9800000006", "WORKER")
    client.post("/api/v1/workers", json={"current_work_region": "Delhi NCR", "expected_daily_wage": 850.0}, headers=w_auth["headers"])
    client.post("/api/v1/workers/me/skills", json={"skill_id": s_brick.id, "skill_level": 3}, headers=w_auth["headers"])

    # Contractor posts requirement
    c_auth = register_and_login(client, "Match Contractor", "9800000007", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Match Co", "contact_person": "MC"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Match Proj", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "Site M", "address": "Exp", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]

    req_id = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{
            "trade_id": t_mason.id,
            "skill_id": s_brick.id,
            "minimum_skill_level": 2,
            "quantity_required": 5,
            "wage_rate": 900.0
        }]
    }, headers=c_auth["headers"]).json()["data"]["id"]

    match_resp = client.get(f"/api/v1/labour-requirements/{req_id}/matches", headers=c_auth["headers"])
    assert match_resp.status_code == 200
    matched_workers = match_resp.json()["data"]["results_by_item"][0]["matched_workers"]
    assert len(matched_workers) >= 1
    assert any(w["name"] == "Ravi Kumar" for w in matched_workers)
    ravi_match = next(w for w in matched_workers if w["name"] == "Ravi Kumar")
    assert "Trade matches" in ravi_match["match_reasons"]
    assert "Required skill matches" in ravi_match["match_reasons"]


# TEST 7: Matching rejects incorrect trade
def test_7_matching_rejects_incorrect_trade(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)

    # Worker: Manoj (Electrician, Industrial Wiring)
    w_auth = register_and_login(client, "Manoj Electrician", "9800000008", "WORKER")
    client.post("/api/v1/workers", json={"current_work_region": "Delhi NCR"}, headers=w_auth["headers"])
    client.post("/api/v1/workers/me/skills", json={"skill_id": s_wiring.id, "skill_level": 3}, headers=w_auth["headers"])

    # Contractor requirement for Mason
    c_auth = register_and_login(client, "Mason Req Co", "9800000009", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Mason Co", "contact_person": "MC"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "P1", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "S1", "address": "A1", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]
    req_id = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{
            "trade_id": t_mason.id,
            "skill_id": s_brick.id,
            "minimum_skill_level": 2,
            "quantity_required": 5,
            "wage_rate": 900.0
        }]
    }, headers=c_auth["headers"]).json()["data"]["id"]

    match_resp = client.get(f"/api/v1/labour-requirements/{req_id}/matches", headers=c_auth["headers"])
    unmatched_workers = match_resp.json()["data"]["results_by_item"][0]["unmatched_workers"]
    assert any(w["name"] == "Manoj Electrician" for w in unmatched_workers)
    manoj_unmatched = next(w for w in unmatched_workers if w["name"] == "Manoj Electrician")
    assert any("Trade mismatch" in d for d in manoj_unmatched["disqualification_reasons"])


# TEST 8: Worker receives offer
def test_8_worker_receives_offer(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    w_auth = register_and_login(client, "Suresh Mason", "9800000010", "WORKER")
    w_prof = client.post("/api/v1/workers", json={}, headers=w_auth["headers"]).json()["data"]

    c_auth = register_and_login(client, "Offer Sender", "9800000011", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Offer Co", "contact_person": "OC"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Proj", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "Site 8", "address": "Address 8", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]
    req = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{"trade_id": t_mason.id, "skill_id": s_brick.id, "minimum_skill_level": 1, "quantity_required": 1, "wage_rate": 900.0}]
    }, headers=c_auth["headers"]).json()["data"]
    item_id = req["items"][0]["id"]

    offer_resp = client.post("/api/v1/offers", json={
        "requirement_item_id": item_id,
        "worker_id": w_prof["id"]
    }, headers=c_auth["headers"])

    assert offer_resp.status_code == 201
    assert offer_resp.json()["data"]["status"] == "PENDING"
    assert offer_resp.json()["data"]["offered_wage"] == 900.0


# TEST 9: Worker accepts offer (Transactional assignment, work order, contact release, audit)
def test_9_worker_accepts_offer(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    w_auth = register_and_login(client, "Accepting Worker", "9800000012", "WORKER")
    w_prof = client.post("/api/v1/workers", json={}, headers=w_auth["headers"]).json()["data"]

    c_auth = register_and_login(client, "Contractor 9", "9800000013", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co 9", "contact_person": "C9"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Proj 9", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "S9", "address": "A9", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]
    req = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{"trade_id": t_mason.id, "skill_id": s_brick.id, "minimum_skill_level": 1, "quantity_required": 1, "wage_rate": 900.0}]
    }, headers=c_auth["headers"]).json()["data"]
    item_id = req["items"][0]["id"]

    offer_id = client.post("/api/v1/offers", json={"requirement_item_id": item_id, "worker_id": w_prof["id"]}, headers=c_auth["headers"]).json()["data"]["id"]

    # Verify contact is NOT released before acceptance
    pre_view = client.get(f"/api/v1/workers/{w_prof['id']}", headers=c_auth["headers"])
    assert pre_view.json()["data"]["phone_number_masked"] == "******"

    # Worker accepts
    acc_resp = client.post(f"/api/v1/offers/{offer_id}/accept", headers=w_auth["headers"])
    assert acc_resp.status_code == 200
    acc_data = acc_resp.json()["data"]
    assert acc_data["status"] == "ACCEPTED"
    assert acc_data["assignment_id"] is not None
    assert acc_data["work_order_id"] is not None

    # Verify worker contact becomes available to contractor after acceptance!
    post_view = client.get(f"/api/v1/workers/{w_prof['id']}", headers=c_auth["headers"])
    assert post_view.json()["data"]["phone_number"] == "9800000012"

    # Verify worker availability updated to WORKING
    w_check = client.get("/api/v1/workers/me", headers=w_auth["headers"])
    assert w_check.json()["data"]["availability_status"] == "WORKING"


# TEST 10: Worker rejects offer (no assignment, contact not released)
def test_10_worker_rejects_offer(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    w_auth = register_and_login(client, "Rejecting Worker", "9800000014", "WORKER")
    w_prof = client.post("/api/v1/workers", json={}, headers=w_auth["headers"]).json()["data"]

    c_auth = register_and_login(client, "Contractor 10", "9800000015", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co 10", "contact_person": "C10"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Proj 10", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "S10", "address": "A10", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]
    req = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{"trade_id": t_mason.id, "skill_id": s_brick.id, "minimum_skill_level": 1, "quantity_required": 1, "wage_rate": 900.0}]
    }, headers=c_auth["headers"]).json()["data"]
    item_id = req["items"][0]["id"]

    offer_id = client.post("/api/v1/offers", json={"requirement_item_id": item_id, "worker_id": w_prof["id"]}, headers=c_auth["headers"]).json()["data"]["id"]

    rej_resp = client.post(f"/api/v1/offers/{offer_id}/reject", headers=w_auth["headers"])
    assert rej_resp.status_code == 200
    assert rej_resp.json()["data"]["status"] == "REJECTED"

    # Contact is NOT released
    post_view = client.get(f"/api/v1/workers/{w_prof['id']}", headers=c_auth["headers"])
    assert post_view.json()["data"]["phone_number_masked"] == "******"

    # No assignments created
    asgns = client.get("/api/v1/assignments", headers=w_auth["headers"]).json()["data"]
    assert len(asgns) == 0


# TEST 11: Worker checks in (NO GPS)
def test_11_worker_checks_in(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    w_auth = register_and_login(client, "Checkin Worker", "9800000016", "WORKER")
    w_prof = client.post("/api/v1/workers", json={}, headers=w_auth["headers"]).json()["data"]

    c_auth = register_and_login(client, "Contractor 11", "9800000017", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co 11", "contact_person": "C11"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Proj 11", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "S11", "address": "A11", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]
    req = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{"trade_id": t_mason.id, "skill_id": s_brick.id, "minimum_skill_level": 1, "quantity_required": 1, "wage_rate": 900.0}]
    }, headers=c_auth["headers"]).json()["data"]

    offer_id = client.post("/api/v1/offers", json={"requirement_item_id": req["items"][0]["id"], "worker_id": w_prof["id"]}, headers=c_auth["headers"]).json()["data"]["id"]
    acc_res = client.post(f"/api/v1/offers/{offer_id}/accept", headers=w_auth["headers"]).json()["data"]
    asgn_id = acc_res["assignment_id"]

    cin_resp = client.post("/api/v1/attendance/check-in", json={
        "assignment_id": asgn_id,
        "confirmation_method": "APP",
        "notes": "Arrived on site"
    }, headers=w_auth["headers"])

    assert cin_resp.status_code == 201
    att_data = cin_resp.json()["data"]
    assert att_data["attendance_status"] == "PENDING_CONFIRMATION"
    assert att_data["worker_confirmed"] is True


# TEST 12: Contractor confirms attendance
def test_12_contractor_confirms_attendance(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    w_auth = register_and_login(client, "Confirm Worker", "9800000018", "WORKER")
    w_prof = client.post("/api/v1/workers", json={}, headers=w_auth["headers"]).json()["data"]

    c_auth = register_and_login(client, "Contractor 12", "9800000019", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co 12", "contact_person": "C12"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Proj 12", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "S12", "address": "A12", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]
    req = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{"trade_id": t_mason.id, "skill_id": s_brick.id, "minimum_skill_level": 1, "quantity_required": 1, "wage_rate": 900.0}]
    }, headers=c_auth["headers"]).json()["data"]

    offer_id = client.post("/api/v1/offers", json={"requirement_item_id": req["items"][0]["id"], "worker_id": w_prof["id"]}, headers=c_auth["headers"]).json()["data"]["id"]
    acc_res = client.post(f"/api/v1/offers/{offer_id}/accept", headers=w_auth["headers"]).json()["data"]
    asgn_id = acc_res["assignment_id"]

    cin = client.post("/api/v1/attendance/check-in", json={"assignment_id": asgn_id}, headers=w_auth["headers"]).json()["data"]

    conf_resp = client.post(f"/api/v1/attendance/{cin['id']}/confirm", json={
        "status": "PRESENT",
        "notes": "Completed full shift"
    }, headers=c_auth["headers"])

    assert conf_resp.status_code == 200
    assert conf_resp.json()["data"]["attendance_status"] == "PRESENT"
    assert conf_resp.json()["data"]["supervisor_confirmed"] is True


# TEST 13: Daily wage calculated
def test_13_daily_wage_calculated(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    w_auth = register_and_login(client, "Wage Worker", "9800000020", "WORKER")
    w_prof = client.post("/api/v1/workers", json={}, headers=w_auth["headers"]).json()["data"]

    c_auth = register_and_login(client, "Contractor 13", "9800000021", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co 13", "contact_person": "C13"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Proj 13", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "S13", "address": "A13", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]
    req = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{"trade_id": t_mason.id, "skill_id": s_brick.id, "minimum_skill_level": 1, "quantity_required": 1, "wage_rate": 900.0}]
    }, headers=c_auth["headers"]).json()["data"]

    offer_id = client.post("/api/v1/offers", json={"requirement_item_id": req["items"][0]["id"], "worker_id": w_prof["id"]}, headers=c_auth["headers"]).json()["data"]["id"]
    acc_res = client.post(f"/api/v1/offers/{offer_id}/accept", headers=w_auth["headers"]).json()["data"]
    cin = client.post("/api/v1/attendance/check-in", json={"assignment_id": acc_res["assignment_id"]}, headers=w_auth["headers"]).json()["data"]
    client.post(f"/api/v1/attendance/{cin['id']}/confirm", json={"status": "PRESENT"}, headers=c_auth["headers"])

    wage_resp = client.get(f"/api/v1/attendance/{cin['id']}/wage", headers=w_auth["headers"])
    assert wage_resp.status_code == 200
    w_data = wage_resp.json()["data"]
    assert w_data["daily_rate"] == 900.0
    assert w_data["calculated_amount"] == 900.0
    assert w_data["attendance_status"] == "PRESENT"


# TEST 14: Payment record created as REPORTED_PAID
def test_14_payment_record_created(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    w_auth = register_and_login(client, "Pay Worker", "9800000022", "WORKER")
    w_prof = client.post("/api/v1/workers", json={}, headers=w_auth["headers"]).json()["data"]

    c_auth = register_and_login(client, "Contractor 14", "9800000023", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co 14", "contact_person": "C14"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Proj 14", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "S14", "address": "A14", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]
    req = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{"trade_id": t_mason.id, "skill_id": s_brick.id, "minimum_skill_level": 1, "quantity_required": 1, "wage_rate": 900.0}]
    }, headers=c_auth["headers"]).json()["data"]

    offer_id = client.post("/api/v1/offers", json={"requirement_item_id": req["items"][0]["id"], "worker_id": w_prof["id"]}, headers=c_auth["headers"]).json()["data"]["id"]
    acc_res = client.post(f"/api/v1/offers/{offer_id}/accept", headers=w_auth["headers"]).json()["data"]
    cin = client.post("/api/v1/attendance/check-in", json={"assignment_id": acc_res["assignment_id"]}, headers=w_auth["headers"]).json()["data"]
    client.post(f"/api/v1/attendance/{cin['id']}/confirm", json={"status": "PRESENT"}, headers=c_auth["headers"])

    pay_resp = client.post("/api/v1/payments", json={
        "attendance_id": cin["id"],
        "amount_reported_paid": 900.0,
        "payment_method": "UPI",
        "payment_reference": "UPI_TXN_998877"
    }, headers=c_auth["headers"])

    assert pay_resp.status_code == 201
    pay_data = pay_resp.json()["data"]
    assert pay_data["amount_reported_paid"] == 900.0
    assert pay_data["payment_status"] == "REPORTED_PAID"
    assert pay_data["payment_reference"] == "UPI_TXN_998877"


# TEST 15: Attendance dispute created
def test_15_attendance_dispute_created(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    w_auth = register_and_login(client, "Dispute Worker", "9800000024", "WORKER")
    w_prof = client.post("/api/v1/workers", json={}, headers=w_auth["headers"]).json()["data"]

    c_auth = register_and_login(client, "Contractor 15", "9800000025", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co 15", "contact_person": "C15"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Proj 15", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "S15", "address": "A15", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]
    req = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{"trade_id": t_mason.id, "skill_id": s_brick.id, "minimum_skill_level": 1, "quantity_required": 1, "wage_rate": 900.0}]
    }, headers=c_auth["headers"]).json()["data"]

    offer_id = client.post("/api/v1/offers", json={"requirement_item_id": req["items"][0]["id"], "worker_id": w_prof["id"]}, headers=c_auth["headers"]).json()["data"]["id"]
    acc_res = client.post(f"/api/v1/offers/{offer_id}/accept", headers=w_auth["headers"]).json()["data"]
    cin = client.post("/api/v1/attendance/check-in", json={"assignment_id": acc_res["assignment_id"]}, headers=w_auth["headers"]).json()["data"]

    disp_resp = client.post(f"/api/v1/attendance/{cin['id']}/dispute", json={
        "description": "Supervisor marked worker as absent incorrectly"
    }, headers=w_auth["headers"])

    assert disp_resp.status_code == 200
    assert disp_resp.json()["data"]["status"] == "DISPUTED"


# TEST 16: Wage changed after acceptance (immutable versioning)
def test_16_wage_changed_after_acceptance(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    w_auth = register_and_login(client, "Version Worker", "9800000026", "WORKER")
    w_prof = client.post("/api/v1/workers", json={}, headers=w_auth["headers"]).json()["data"]

    c_auth = register_and_login(client, "Contractor 16", "9800000027", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co 16", "contact_person": "C16"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Proj 16", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "S16", "address": "A16", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]
    req = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{"trade_id": t_mason.id, "skill_id": s_brick.id, "minimum_skill_level": 1, "quantity_required": 1, "wage_rate": 900.0}]
    }, headers=c_auth["headers"]).json()["data"]

    offer_id = client.post("/api/v1/offers", json={"requirement_item_id": req["items"][0]["id"], "worker_id": w_prof["id"]}, headers=c_auth["headers"]).json()["data"]["id"]
    acc_res = client.post(f"/api/v1/offers/{offer_id}/accept", headers=w_auth["headers"]).json()["data"]
    wo_id = acc_res["work_order_id"]

    # Propose revised version (₹950/day)
    v2_resp = client.post(f"/api/v1/work-orders/{wo_id}/versions", json={
        "wage_rate": 950.0,
        "reason": "Overtime and site complexity increase"
    }, headers=c_auth["headers"])

    assert v2_resp.status_code == 201
    v2_data = v2_resp.json()["data"]
    assert v2_data["version_number"] == 2
    assert v2_data["agreed_wage_rate"] == 950.0
    assert v2_data["worker_confirmed"] is False  # Must require confirmation!

    # Verify original version 1 unchanged
    wo_details = client.get(f"/api/v1/work-orders/{wo_id}", headers=c_auth["headers"]).json()["data"]
    assert len(wo_details["versions"]) == 2
    assert wo_details["versions"][0]["agreed_wage_rate"] == 900.0
    assert wo_details["versions"][0]["worker_confirmed"] is True

    # Worker confirms revised version
    conf_resp = client.post(f"/api/v1/work-order-versions/{v2_data['id']}/confirm", headers=w_auth["headers"])
    assert conf_resp.status_code == 200
    assert conf_resp.json()["data"]["worker_confirmed"] is True


# TEST 17: Worker fails to attend -> replacement workflow
def test_17_worker_replacement_workflow(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    w_auth = register_and_login(client, "NoShow Worker", "9800000028", "WORKER")
    w_prof = client.post("/api/v1/workers", json={}, headers=w_auth["headers"]).json()["data"]

    c_auth = register_and_login(client, "Contractor 17", "9800000029", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co 17", "contact_person": "C17"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Proj 17", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "S17", "address": "A17", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]
    req = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{"trade_id": t_mason.id, "skill_id": s_brick.id, "minimum_skill_level": 1, "quantity_required": 1, "wage_rate": 900.0}]
    }, headers=c_auth["headers"]).json()["data"]

    offer_id = client.post("/api/v1/offers", json={"requirement_item_id": req["items"][0]["id"], "worker_id": w_prof["id"]}, headers=c_auth["headers"]).json()["data"]["id"]
    acc_res = client.post(f"/api/v1/offers/{offer_id}/accept", headers=w_auth["headers"]).json()["data"]
    asgn_id = acc_res["assignment_id"]

    # Request replacement
    rep_resp = client.post(f"/api/v1/assignments/{asgn_id}/replacement-request", json={
        "reason": "Worker did not show up on morning shift"
    }, headers=c_auth["headers"])

    assert rep_resp.status_code == 200
    rep_data = rep_resp.json()["data"]
    assert rep_data["status"] == "REPLACED"

    # Original assignment remains in history!
    asgn_check = client.get(f"/api/v1/assignments/{asgn_id}", headers=c_auth["headers"]).json()["data"]
    assert asgn_check["status"] == "REPLACED"
    assert asgn_check["replacement_reason"] == "Worker did not show up on morning shift"


# TEST 18: Unauthorized contractor attempts to access another contractor's project
def test_18_unauthorized_contractor_access(client):
    c1 = register_and_login(client, "Owner Contractor", "9800000030", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co Owner", "contact_person": "CO"}, headers=c1["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Private Project", "start_date": str(date.today())}, headers=c1["headers"]).json()["data"]["id"]

    c2 = register_and_login(client, "Intruder Contractor", "9800000031", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co Intruder", "contact_person": "CI"}, headers=c2["headers"])

    # Attempt to read c1's project
    resp = client.get(f"/api/v1/projects/{p_id}", headers=c2["headers"])
    assert resp.status_code == 403


# TEST 19: Worker attempts to access another worker's attendance
def test_19_worker_access_other_attendance(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    w1 = register_and_login(client, "Worker 1", "9800000032", "WORKER")
    w1_prof = client.post("/api/v1/workers", json={}, headers=w1["headers"]).json()["data"]

    c = register_and_login(client, "Contractor 19", "9800000033", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co 19", "contact_person": "C19"}, headers=c["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Proj 19", "start_date": str(date.today())}, headers=c["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "S19", "address": "A19", "region": "Delhi NCR"}, headers=c["headers"]).json()["data"]["id"]
    req = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{"trade_id": t_mason.id, "skill_id": s_brick.id, "minimum_skill_level": 1, "quantity_required": 1, "wage_rate": 900.0}]
    }, headers=c["headers"]).json()["data"]

    offer_id = client.post("/api/v1/offers", json={"requirement_item_id": req["items"][0]["id"], "worker_id": w1_prof["id"]}, headers=c["headers"]).json()["data"]["id"]
    acc_res = client.post(f"/api/v1/offers/{offer_id}/accept", headers=w1["headers"]).json()["data"]
    cin = client.post("/api/v1/attendance/check-in", json={"assignment_id": acc_res["assignment_id"]}, headers=w1["headers"]).json()["data"]

    # Worker 2 attempts to calculate wage on Worker 1's attendance
    w2 = register_and_login(client, "Worker 2", "9800000034", "WORKER")
    client.post("/api/v1/workers", json={}, headers=w2["headers"])

    resp = client.get(f"/api/v1/attendance/{cin['id']}/wage", headers=w2["headers"])
    assert resp.status_code == 403


# TEST 20: Duplicate offer acceptance
def test_20_duplicate_offer_acceptance(client, db):
    t_mason, t_elec, s_brick, s_wiring = setup_trades_and_skills(db)
    w_auth = register_and_login(client, "Dupe Worker", "9800000035", "WORKER")
    w_prof = client.post("/api/v1/workers", json={}, headers=w_auth["headers"]).json()["data"]

    c_auth = register_and_login(client, "Contractor 20", "9800000036", "CONTRACTOR")
    client.post("/api/v1/contractors", json={"company_name": "Co 20", "contact_person": "C20"}, headers=c_auth["headers"])
    p_id = client.post("/api/v1/projects", json={"name": "Proj 20", "start_date": str(date.today())}, headers=c_auth["headers"]).json()["data"]["id"]
    s_id = client.post(f"/api/v1/projects/{p_id}/sites", json={"name": "S20", "address": "A20", "region": "Delhi NCR"}, headers=c_auth["headers"]).json()["data"]["id"]
    req = client.post("/api/v1/labour-requirements", json={
        "project_id": p_id,
        "site_id": s_id,
        "required_start_date": str(date.today()),
        "required_end_date": str(date.today() + timedelta(days=30)),
        "items": [{"trade_id": t_mason.id, "skill_id": s_brick.id, "minimum_skill_level": 1, "quantity_required": 1, "wage_rate": 900.0}]
    }, headers=c_auth["headers"]).json()["data"]

    offer_id = client.post("/api/v1/offers", json={"requirement_item_id": req["items"][0]["id"], "worker_id": w_prof["id"]}, headers=c_auth["headers"]).json()["data"]["id"]

    # First acceptance succeeds
    first_resp = client.post(f"/api/v1/offers/{offer_id}/accept", headers=w_auth["headers"])
    assert first_resp.status_code == 200

    # Second acceptance must fail with 409 Conflict
    second_resp = client.post(f"/api/v1/offers/{offer_id}/accept", headers=w_auth["headers"])
    assert second_resp.status_code == 409
    assert second_resp.json()["error"]["code"] == "OFFER_ALREADY_ACCEPTED"
