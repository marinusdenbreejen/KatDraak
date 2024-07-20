import jwt
import time
from pathlib import Path

TEAM_ID = "GN459M9C63"
AUTH_KEY_ID = "NWUX9JTZGK"
AUTH_KEY_PATH = "key/AuthKey_NWUX9JTZGK.p8"

current_time = int(time.time())
token = jwt.encode(
    payload={"iss": TEAM_ID, "iat": current_time},
    key=Path(AUTH_KEY_PATH).read_text(),
    algorithm="ES256",
    headers={"kid": AUTH_KEY_ID},
)

print(token)
