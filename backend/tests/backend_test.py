"""
Backend tests for Collaborative Democracy Lab.
Covers: auth (register/login/me/logout), examples, AI endpoints (opposing/concerns/needs/solutions),
issue map CRUD, and access control.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://dialogue-map-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@democracylab.app"
ADMIN_PASSWORD = "DemocracyLab2026!"


@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="session")
def new_user_session():
    s = requests.Session()
    email = f"test_user_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "Test User"}, timeout=15)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    s.email = email
    return s


# ---- Auth ----
class TestAuth:
    def test_register_and_me(self, new_user_session):
        r = new_user_session.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == new_user_session.email
        assert data["role"] == "user"
        assert "id" in data

    def test_register_duplicate(self, new_user_session):
        r = new_user_session.post(
            f"{API}/auth/register",
            json={"email": new_user_session.email, "password": "TestPass123!", "name": "Dup"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_login_admin(self, admin_session):
        r = admin_session.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL
        assert r.json()["role"] == "admin"

    def test_login_invalid(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong-password-zzz"}, timeout=10)
        assert r.status_code in (401, 429)

    def test_me_requires_auth(self):
        s = requests.Session()
        r = s.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_logout(self):
        s = requests.Session()
        email = f"TEST_logout_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "Logout"}, timeout=10)
        assert r.status_code == 200
        r = s.post(f"{API}/auth/logout", timeout=10)
        assert r.status_code == 200
        r = s.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401


# ---- Examples ----
class TestExamples:
    def test_examples_unauth_ok(self):
        r = requests.get(f"{API}/examples", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 6
        keys = {e.get("key") for e in data}
        assert {"abortion", "immigration", "economy", "gun_violence", "free_speech", "affirmative_action"}.issubset(keys)
        for ex in data:
            assert ex.get("issue")
            assert ex.get("position_a")
            assert ex.get("position_b")


# ---- AI endpoints (require auth) ----
class TestAI:
    def test_opposing_requires_auth(self):
        r = requests.post(f"{API}/ai/opposing-position", json={"issue": "x", "position_a": "y"}, timeout=10)
        assert r.status_code == 401

    def test_opposing(self, new_user_session):
        r = new_user_session.post(
            f"{API}/ai/opposing-position",
            json={"issue": "Gun violence", "position_a": "Stricter background checks save lives."},
            timeout=45,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "opposing_position" in data
        assert isinstance(data["opposing_position"], str) and len(data["opposing_position"]) > 10

    def test_concerns(self, new_user_session):
        r = new_user_session.post(
            f"{API}/ai/concerns",
            json={"issue": "Immigration", "position": "We need stronger borders."},
            timeout=45,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list) and len(data["suggestions"]) >= 1

    def test_needs(self, new_user_session):
        r = new_user_session.post(
            f"{API}/ai/needs",
            json={
                "issue": "Gun violence",
                "position_a": "Stricter background checks save lives.",
                "position_b": "Self-defense rights must be preserved.",
                "concerns_a": "Mass shootings, children's safety",
            },
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "needs_a" in data and "needs_b" in data
        assert isinstance(data["needs_a"], list) and len(data["needs_a"]) >= 3
        assert isinstance(data["needs_b"], list) and len(data["needs_b"]) >= 3

    def test_solutions(self, new_user_session):
        r = new_user_session.post(
            f"{API}/ai/solutions",
            json={
                "issue": "Gun violence",
                "position_a": "Stricter background checks save lives.",
                "position_b": "Self-defense rights must be preserved.",
                "needs_a": ["safety", "predictability", "protect children"],
                "needs_b": ["self-determination", "self-defense", "trust in institutions"],
            },
            timeout=90,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "solutions" in data
        sols = data["solutions"]
        assert isinstance(sols, list) and 3 <= len(sols) <= 6
        first = sols[0]
        assert first.get("title")
        assert first.get("description")
        assert "needs_satisfied_a" in first
        assert "needs_satisfied_b" in first


# ---- Issue map CRUD ----
class TestMapCRUD:
    created_id = None

    def test_create_map(self, new_user_session):
        payload = {
            "title": "TEST_Gun violence map",
            "issue": "Gun violence",
            "position_a": "Stricter checks save lives.",
            "position_b": "Self-defense rights matter.",
            "concerns_a": "School safety",
            "needs_a": ["safety", "predictability"],
            "needs_b": ["self-defense", "freedom"],
            "solutions": [{
                "title": "Universal background checks",
                "description": "Close loopholes...",
                "needs_satisfied_a": ["safety"],
                "needs_satisfied_b": ["freedom"],
                "needs_unaddressed": [],
                "improvements": "Add appeals.",
            }],
            "reflection": {"promising": "x", "unmet": "y", "improve": "z", "changed": "w"},
        }
        r = new_user_session.post(f"{API}/maps", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data
        assert data["title"] == payload["title"]
        assert data["issue"] == payload["issue"]
        assert data["needs_a"] == payload["needs_a"]
        assert "_id" not in data
        TestMapCRUD.created_id = data["id"]

    def test_list_maps(self, new_user_session):
        r = new_user_session.get(f"{API}/maps", timeout=10)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert any(it["id"] == TestMapCRUD.created_id for it in items)

    def test_get_map(self, new_user_session):
        r = new_user_session.get(f"{API}/maps/{TestMapCRUD.created_id}", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == TestMapCRUD.created_id
        assert data["issue"] == "Gun violence"

    def test_update_map(self, new_user_session):
        payload = {
            "title": "TEST_Updated title",
            "issue": "Gun violence",
            "position_a": "Updated A",
            "position_b": "Updated B",
            "concerns_a": "Updated concerns",
            "needs_a": ["safety"],
            "needs_b": ["freedom"],
            "solutions": [],
            "reflection": {"promising": "p", "unmet": "u", "improve": "i", "changed": "c"},
        }
        r = new_user_session.put(f"{API}/maps/{TestMapCRUD.created_id}", json=payload, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "TEST_Updated title"
        assert data["position_a"] == "Updated A"
        # Verify persistence via GET
        r2 = new_user_session.get(f"{API}/maps/{TestMapCRUD.created_id}", timeout=10)
        assert r2.json()["title"] == "TEST_Updated title"

    def test_delete_map(self, new_user_session):
        r = new_user_session.delete(f"{API}/maps/{TestMapCRUD.created_id}", timeout=10)
        assert r.status_code == 200
        r2 = new_user_session.get(f"{API}/maps/{TestMapCRUD.created_id}", timeout=10)
        assert r2.status_code == 404

    def test_maps_isolation(self, new_user_session):
        """Maps from another user must not be visible."""
        s = requests.Session()
        email = f"TEST_iso_{uuid.uuid4().hex[:8]}@example.com"
        s.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "Iso"}, timeout=10)
        r = s.post(f"{API}/maps", json={"title": "TEST_iso", "issue": "ISO"}, timeout=10)
        assert r.status_code == 200
        other_id = r.json()["id"]
        # Original user should NOT see this id
        r2 = new_user_session.get(f"{API}/maps/{other_id}", timeout=10)
        assert r2.status_code == 404
        # Cleanup
        s.delete(f"{API}/maps/{other_id}", timeout=10)

    def test_maps_unauth(self):
        r = requests.get(f"{API}/maps", timeout=10)
        assert r.status_code == 401
