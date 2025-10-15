from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities_returns_200_and_structure():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect some known activities exist
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_and_unregister_cycle():
    activity = "Chess Club"
    email = "test.user@mergington.edu"

    # Ensure email not already in participants
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body["message"]
    assert email in activities[activity]["participants"]

    # Signing up again should return 409
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 409

    # Unregister
    resp3 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp3.status_code == 200
    assert email not in activities[activity]["participants"]


def test_signup_nonexistent_activity():
    resp = client.post("/activities/NoSuchActivity/signup?email=foo@bar.com")
    assert resp.status_code == 404


def test_unregister_nonexistent_participant():
    activity = "Chess Club"
    email = "nobody@mergington.edu"

    # Ensure not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 404
