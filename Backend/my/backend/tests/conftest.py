import pytest
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = os.getenv(
    "DATABASE_URL_TEST",
    "postgresql+psycopg2://postgres:nexus2026@localhost:5432/kaamconnect_test"
)

test_engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db_schema():
    Base.metadata.create_all(bind=test_engine)
    yield

@pytest.fixture(autouse=True)
def truncate_tables_after_test():
    yield
    # Fast truncate across all tables to isolate tests
    with test_engine.connect() as conn:
        table_names = ", ".join([f'"{table.name}"' for table in reversed(Base.metadata.sorted_tables)])
        conn.execute(text(f"TRUNCATE TABLE {table_names} RESTART IDENTITY CASCADE;"))
        conn.commit()

@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db):
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
