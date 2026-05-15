import os
import sys

# Ensure the app module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    print("Testing GET / ...")
    response = client.get("/")
    print("Status:", response.status_code)
    print("Response:", response.json())
    print("-" * 40)


def test_signup_and_login():
    print("Testing POST /auth/signup ...")
    signup_payload = {
        "email": "testcitizen2@odyssey.gov",
        "password": "Password123!",
        "first_name": "Test",
        "last_name": "Citizen2",
    }
    response = client.post("/auth/signup", json=signup_payload)
    print("Signup Status:", response.status_code)
    try:
        print("Signup Response:", response.json())
    except Exception as e:
        print("Response not JSON:", response.text)
    print("-" * 40)

    print("Testing POST /auth/login ...")
    login_payload = {"email": "testcitizen2@odyssey.gov", "password": "Password123!"}
    response = client.post("/auth/login", json=login_payload)
    print("Login Status:", response.status_code)
    try:
        print("Login Response:", response.json())
    except Exception as e:
        print("Response not JSON:", response.text)
    print("-" * 40)


def test_complaints():
    print("Testing POST /complaints/ ...")
    # First login to get a valid token
    login_payload = {"email": "testcitizen2@odyssey.gov", "password": "Password123!"}
    login_res = client.post("/auth/login", json=login_payload)
    token = login_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    complaint_payload = {
        "title": "Broken Streetlight",
        "description": "The streetlight at 5th and Main is flickering rapidly.",
        "lat": 40.7128,
        "lon": -74.0060,
        "image_url": "http://example.com/image.jpg",
        "urgency_level": "low",
    }

    response = client.post("/complaints/", json=complaint_payload, headers=headers)
    print("Create Complaint Status:", response.status_code)
    try:
        print("Create Complaint Response:", response.json())
    except Exception:
        print("Response not JSON:", response.text)
    print("-" * 40)

    print("Testing GET /complaints/ ...")
    response = client.get("/complaints/", headers=headers)
    print("Get Complaints Status:", response.status_code)
    try:
        print("Get Complaints Response:", response.json())
    except Exception:
        print("Response not JSON:", response.text)
    print("-" * 40)


if __name__ == "__main__":
    test_health_check()
    test_signup_and_login()
    test_complaints()
