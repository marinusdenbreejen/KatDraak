import httpx
import jwt
import time
from pathlib import Path

# Zorg ervoor dat httpx met HTTP/2 werkt
httpx_client = httpx.Client(http2=True)

APNS_URL = "https://api.sandbox.push.apple.com:443/3/device/"
BUNDLE_ID = "mhc.wakeupOldiPad"
AUTH_KEY_PATH = "key/AuthKey_NWUX9JTZGK.p8"
AUTH_KEY_ID = "NWUX9JTZGK"
TEAM_ID = "GN459M9C63"
#new iPad 
#DEVICE_TOKEN = "2e2fbc37951f42a71fd45cb0d056d3514aa4da3f3c004d30f6fdb69ed01a70e6"
DEVICE_TOKEN = "887c2c8fc469f598602f10584cc1c2dda80e808e987601f2fd72a7a09742293f"


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

def send_notification(payload, device_token):
    headers = {
        "apns-expiration": "0",
        "apns-priority": "10",
        "apns-topic": BUNDLE_ID,
        "authorization": f"bearer {create_jwt()}",
    }

    response = None  # Initialisatie van response
    try:
        response = httpx_client.post(
            f"{APNS_URL}{device_token}",
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
    response = send_notification(payload, DEVICE_TOKEN)
