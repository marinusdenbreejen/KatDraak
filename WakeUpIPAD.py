import httpx
import jwt
import time
from pathlib import Path
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Zorg ervoor dat httpx met HTTP/2 werkt
httpx_client = httpx.Client(http2=True)

APNS_URL = "https://api.sandbox.push.apple.com:443/3/device/"
BUNDLE_ID = os.getenv("BUNDLE_ID")
AUTH_KEY_PATH = os.getenv("AUTH_KEY_PATH")
AUTH_KEY_ID = os.getenv("AUTH_KEY_ID")
TEAM_ID = os.getenv("TEAM_ID")
DEVICE_TOKEN = os.getenv("DEVICE_TOKEN")

payload = {
    "aps": {
        "alert": {
            "title": "Wake Up!",
            "body": "It's time to wake up and check your iPad."
        },
        "badge": 1,
        "sound": "default"
    }
}

def create_jwt():
    current_time = int(time.time())
    token = jwt.encode(
        payload={"iss": TEAM_ID, "iat": current_time},
        key=Path(AUTH_KEY_PATH).read_text(),
        algorithm="ES256",
        headers={"kid": AUTH_KEY_ID},
    )
    print("JWT Created")
    return token

def send_notification():
    headers = {
        "apns-expiration": "0",
        "apns-priority": "10",
        "apns-topic": BUNDLE_ID,
        "authorization": f"bearer {create_jwt()}",
    }

    response = None  # Initialisatie van response
    try:
        response = httpx_client.post(
            f"{APNS_URL}{DEVICE_TOKEN}",
            json=payload,
            headers=headers,
            timeout=10.0,
        )
        response.raise_for_status()
        print(f"Notification sent successfully: {response.status_code}")
    except httpx.RequestError as e:
        print(f"An error occurred while requesting: {e.request.url!r}. Error: {e}")
    except httpx.HTTPStatusError as e:
        print(f"Error response {e.response.status_code} while requesting {e.request.url!r}. Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

    return response

if __name__ == "__main__":
    response = send_notification()
