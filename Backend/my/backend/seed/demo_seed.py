import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models import (
    Base, User, UserRole, UserStatus,
    Worker, WorkerAvailability, WorkerVerificationStatus,
    Contractor, Project, Site, ProjectStatus,
    Trade, Skill, WorkerSkill, SkillLevel, VerificationStatus,
    LabourRequirement, LabourRequirementItem, RequirementStatus, WagePeriod, ItemStatus,
    PreferredWorker, Team, TeamMember
)

def seed_database(db: Session = None):
    close_at_end = False
    if db is None:
        db = SessionLocal()
        close_at_end = True

    try:
        # Check if already seeded
        if db.query(Trade).first():
            print("Database already contains seed data. Skipping seed.")
            return

        print("Seeding KaamConnect Trades & Skills...")
        # 1. Trades
        trades_dict = {
            "MASON": "Skilled masonry, brickwork, blockwork, plastering, concrete",
            "HELPER": "General construction assistance, material handling, site cleanup",
            "ELECTRICIAN": "Wiring, panels, industrial and residential electrical installations",
            "PLUMBER": "Piping, drainage, sanitary fitting, water supply",
            "CARPENTER": "Formwork, shuttering, doors, framing, furniture",
            "PAINTER": "Surface preparation, interior/exterior painting, waterproof coatings",
            "WELDER": "Arc, MIG, TIG, and structural welding",
            "TILE_WORKER": "Floor and wall tiling, stone laying, grouting",
            "BAR_BENDER": "Rebar bending, cutting, reinforcement cages",
            "GENERAL_LABOUR": "Unskilled and semi-skilled general site labor"
        }

        trade_objs = {}
        for t_name, desc in trades_dict.items():
            trade = Trade(name=t_name, description=desc)
            db.add(trade)
            db.flush()
            trade_objs[t_name] = trade

        # 2. Skills per Trade
        skills_data = {
            "MASON": ["Brick Masonry", "Block Masonry", "Plastering", "Concrete Work", "Stone Masonry"],
            "HELPER": ["General Construction", "Material Moving", "Concrete Mixing", "Site Cleanup"],
            "ELECTRICIAN": ["House Wiring", "Industrial Wiring", "Panel Installation", "Electrical Repair", "Conduit Installation"],
            "PLUMBER": ["Pipe Installation", "Water Supply", "Drainage", "Sanitary Fitting", "Leak Repair"],
            "CARPENTER": ["Formwork", "Shuttering", "Door Installation", "Window Installation"],
            "PAINTER": ["Interior Painting", "Exterior Painting", "Wall Preparation", "Waterproof Coating"],
            "WELDER": ["Arc Welding", "MIG Welding", "Structural Welding"],
            "TILE_WORKER": ["Floor Tiling", "Wall Tiling", "Tile Cutting", "Grouting"]
        }

        skill_objs = {}
        for t_name, s_names in skills_data.items():
            t_obj = trade_objs[t_name]
            for s_name in s_names:
                skill = Skill(trade_id=t_obj.id, name=s_name, description=f"{s_name} in {t_name}")
                db.add(skill)
                db.flush()
                skill_objs[(t_name, s_name)] = skill

        # 3. Users: Admin, Supervisor, Contractors, Workers
        print("Seeding Users and Profiles...")
        default_pwd = get_password_hash("password123")

        # Admin User
        admin_user = User(
            name="System Admin",
            phone_number="9999900000",
            hashed_password=default_pwd,
            role=UserRole.ADMIN,
            phone_verified=True,
            status=UserStatus.ACTIVE
        )
        db.add(admin_user)

        # Supervisor User
        supervisor_user = User(
            name="Vikram Supervisor",
            phone_number="9888800000",
            hashed_password=default_pwd,
            role=UserRole.SUPERVISOR,
            phone_verified=True,
            status=UserStatus.ACTIVE
        )
        db.add(supervisor_user)
        db.flush()

        # Contractors
        # 1. Sunrise Construction
        c1_user = User(
            name="Ramesh Sharma",
            phone_number="9811100001",
            hashed_password=default_pwd,
            role=UserRole.CONTRACTOR,
            phone_verified=True,
            status=UserStatus.ACTIVE
        )
        db.add(c1_user)
        db.flush()
        c1 = Contractor(
            user_id=c1_user.id,
            company_name="Sunrise Construction",
            contact_person="Ramesh Sharma",
            verification_status="VERIFIED"
        )
        db.add(c1)
        db.flush()

        # 2. BuildRight Contractors
        c2_user = User(
            name="Anita Desai",
            phone_number="9811100002",
            hashed_password=default_pwd,
            role=UserRole.CONTRACTOR,
            phone_verified=True,
            status=UserStatus.ACTIVE
        )
        db.add(c2_user)
        db.flush()
        c2 = Contractor(
            user_id=c2_user.id,
            company_name="BuildRight Contractors",
            contact_person="Anita Desai",
            verification_status="VERIFIED"
        )
        db.add(c2)
        db.flush()

        # 4. Projects & Sites (NO GPS!)
        print("Seeding Projects & Sites (Strictly without GPS)...")
        today = datetime.date.today()
        # Sunrise Apartment Project
        p1 = Project(
            contractor_id=c1.id,
            name="Sunrise Apartment Project",
            description="Luxury residential complex construction (12 towers)",
            project_status=ProjectStatus.ACTIVE,
            start_date=today,
            expected_end_date=today + datetime.timedelta(days=180)
        )
        db.add(p1)
        db.flush()

        s1 = Site(
            project_id=p1.id,
            name="Sunrise Site A",
            address="Plot 42, Sector 62, Expressway",
            region="Delhi NCR",
            supervisor_id=supervisor_user.id,
            active=True
        )
        db.add(s1)

        # Riverside Commercial Building
        p2 = Project(
            contractor_id=c2.id,
            name="Riverside Commercial Building",
            description="Grade-A Commercial IT park",
            project_status=ProjectStatus.ACTIVE,
            start_date=today,
            expected_end_date=today + datetime.timedelta(days=365)
        )
        db.add(p2)
        db.flush()

        s2 = Site(
            project_id=p2.id,
            name="Riverside Site",
            address="Plot 10, Riverfront Road",
            region="Delhi NCR",
            supervisor_id=supervisor_user.id,
            active=True
        )
        db.add(s2)
        db.flush()

        # 5. Workers
        print("Seeding Realistic Worker Profiles...")
        workers_info = [
            {
                "name": "Ravi Kumar",
                "phone": "9876500001",
                "lang": "hi",
                "home_region": "Patna, Bihar",
                "current_work_region": "Delhi NCR",
                "expected_wage": 850.0,
                "skills": [
                    ("MASON", "Brick Masonry", SkillLevel.ADVANCED, VerificationStatus.CONTRACTOR_VERIFIED),
                    ("MASON", "Block Masonry", SkillLevel.INTERMEDIATE, VerificationStatus.SUPERVISOR_VERIFIED)
                ]
            },
            {
                "name": "Suresh",
                "phone": "9876500002",
                "lang": "hi",
                "home_region": "Gorakhpur, UP",
                "current_work_region": "Delhi NCR",
                "expected_wage": 800.0,
                "skills": [
                    ("MASON", "Brick Masonry", SkillLevel.INTERMEDIATE, VerificationStatus.SELF_DECLARED)
                ]
            },
            {
                "name": "Manoj",
                "phone": "9876500003",
                "lang": "hi",
                "home_region": "Muzaffarpur, Bihar",
                "current_work_region": "Delhi NCR",
                "expected_wage": 1100.0,
                "skills": [
                    ("ELECTRICIAN", "Industrial Wiring", SkillLevel.ADVANCED, VerificationStatus.WORK_VERIFIED),
                    ("ELECTRICIAN", "House Wiring", SkillLevel.ADVANCED, VerificationStatus.WORK_VERIFIED)
                ]
            },
            {
                "name": "Arun",
                "phone": "9876500004",
                "lang": "hi",
                "home_region": "Ranchi, Jharkhand",
                "current_work_region": "Delhi NCR",
                "expected_wage": 650.0,
                "skills": [
                    ("HELPER", "General Construction", SkillLevel.INTERMEDIATE, VerificationStatus.SELF_DECLARED)
                ]
            },
            {
                "name": "Priya",
                "phone": "9876500005",
                "lang": "hi",
                "home_region": "Jaipur, Rajasthan",
                "current_work_region": "Delhi NCR",
                "expected_wage": 900.0,
                "skills": [
                    ("PAINTER", "Interior Painting", SkillLevel.ADVANCED, VerificationStatus.CONTRACTOR_VERIFIED)
                ]
            }
        ]

        created_workers = {}
        for wi in workers_info:
            w_u = User(
                name=wi["name"],
                phone_number=wi["phone"],
                hashed_password=default_pwd,
                role=UserRole.WORKER,
                phone_verified=True,
                status=UserStatus.ACTIVE
            )
            db.add(w_u)
            db.flush()

            w_prof = Worker(
                user_id=w_u.id,
                preferred_language=wi["lang"],
                home_region=wi["home_region"],
                current_work_region=wi["current_work_region"],
                expected_daily_wage=wi["expected_wage"],
                availability_status=WorkerAvailability.AVAILABLE,
                verification_status=WorkerVerificationStatus.FULLY_VERIFIED
            )
            db.add(w_prof)
            db.flush()
            created_workers[wi["name"]] = w_prof

            for trade_key, skill_name_key, s_level, v_status in wi["skills"]:
                sk_obj = skill_objs.get((trade_key, skill_name_key))
                if sk_obj:
                    w_skill = WorkerSkill(
                        worker_id=w_prof.id,
                        skill_id=sk_obj.id,
                        skill_level=s_level.value,
                        verification_status=v_status,
                        evidence_reference="SITE_INSPECTION_RECORD_2026"
                    )
                    db.add(w_skill)

        # 6. Preferred Worker
        pw = PreferredWorker(
            contractor_id=c1.id,
            worker_id=created_workers["Ravi Kumar"].id,
            notes="Reliable lead mason on Sector 40 project"
        )
        db.add(pw)

        # 7. Predefined Team Template
        # Masonry Team: 1 Advanced Mason + 2 Helpers
        team = Team(
            contractor_id=c1.id,
            name="Masonry Team Alpha",
            description="Standard masonry unit: 1 Advanced Mason and 2 Helpers"
        )
        db.add(team)
        db.flush()

        tm1 = TeamMember(
            team_id=team.id,
            trade_id=trade_objs["MASON"].id,
            skill_id=skill_objs[("MASON", "Brick Masonry")].id,
            minimum_skill_level=SkillLevel.ADVANCED.value,
            quantity=1
        )
        tm2 = TeamMember(
            team_id=team.id,
            trade_id=trade_objs["HELPER"].id,
            skill_id=skill_objs[("HELPER", "General Construction")].id,
            minimum_skill_level=SkillLevel.BEGINNER.value,
            quantity=2
        )
        db.add(tm1)
        db.add(tm2)

        # 8. Demo Labour Requirement
        # Project: Sunrise Apartment Project, Site: Sunrise Site A
        # Line 1: 10 Masons, Skill: Brick Masonry, Min: Intermediate, ₹900/day
        # Line 2: 20 Helpers, Skill: General Construction, ₹700/day
        # Line 3: 2 Electricians, Skill: Industrial Wiring, Min: Advanced, ₹1,200/day
        print("Seeding Demo Labour Requirement #1001...")
        demo_req = LabourRequirement(
            contractor_id=c1.id,
            project_id=p1.id,
            site_id=s1.id,
            required_start_date=today,
            required_end_date=today + datetime.timedelta(days=90),
            work_schedule="08:00-17:00",
            status=RequirementStatus.OPEN
        )
        db.add(demo_req)
        db.flush()

        item1 = LabourRequirementItem(
            requirement_id=demo_req.id,
            trade_id=trade_objs["MASON"].id,
            skill_id=skill_objs[("MASON", "Brick Masonry")].id,
            minimum_skill_level=SkillLevel.INTERMEDIATE.value,
            quantity_required=10,
            wage_rate=900.0,
            wage_period=WagePeriod.DAILY,
            duration="3 months",
            schedule="08:00-17:00",
            filled_quantity=0,
            status=ItemStatus.OPEN
        )
        item2 = LabourRequirementItem(
            requirement_id=demo_req.id,
            trade_id=trade_objs["HELPER"].id,
            skill_id=skill_objs[("HELPER", "General Construction")].id,
            minimum_skill_level=SkillLevel.BEGINNER.value,
            quantity_required=20,
            wage_rate=700.0,
            wage_period=WagePeriod.DAILY,
            duration="3 months",
            schedule="08:00-17:00",
            filled_quantity=0,
            status=ItemStatus.OPEN
        )
        item3 = LabourRequirementItem(
            requirement_id=demo_req.id,
            trade_id=trade_objs["ELECTRICIAN"].id,
            skill_id=skill_objs[("ELECTRICIAN", "Industrial Wiring")].id,
            minimum_skill_level=SkillLevel.ADVANCED.value,
            quantity_required=2,
            wage_rate=1200.0,
            wage_period=WagePeriod.DAILY,
            duration="3 months",
            schedule="08:00-17:00",
            filled_quantity=0,
            status=ItemStatus.OPEN
        )
        db.add(item1)
        db.add(item2)
        db.add(item3)

        db.commit()
        print("KaamConnect Demo Seed data completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during database seed: {e}")
        raise
    finally:
        if close_at_end:
            db.close()

if __name__ == "__main__":
    seed_database()
