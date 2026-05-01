import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services_common.aws_helper import get_table


security = HTTPBearer(auto_error=False)
JWT_SECRET = os.getenv("JWT_SECRET", "local-demo-secret").encode("utf-8")

DEMO_PASSWORDS = {
    "admin@demo.local": ("admin123!demo", "USER#admin", "admin"),
    "alice@demo.local": ("alice123!demo", "USER#alice", "user"),
    "bob@demo.local": ("bob123!demo", "USER#bob", "user"),
}


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _unb64(data: str) -> bytes:
    padded = data + "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(padded.encode("ascii"))


def issue_token(user: dict[str, Any]) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user["userId"],
        "email": user["email"],
        "role": user["role"],
        "tenantId": user.get("tenantId", "demo"),
        "exp": int(time.time()) + 8 * 60 * 60,
    }
    signing_input = f"{_b64(json.dumps(header, separators=(',', ':')).encode())}.{_b64(json.dumps(payload, separators=(',', ':')).encode())}"
    sig = hmac.new(JWT_SECRET, signing_input.encode("ascii"), hashlib.sha256).digest()
    return f"{signing_input}.{_b64(sig)}"


def verify_token(token: str) -> dict[str, Any]:
    try:
        header_b64, payload_b64, sig_b64 = token.split(".")
        signing_input = f"{header_b64}.{payload_b64}"
        expected = hmac.new(JWT_SECRET, signing_input.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _unb64(sig_b64)):
            raise ValueError("bad signature")
        payload = json.loads(_unb64(payload_b64))
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("expired")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="invalid_token")


def authenticate(email: str, password: str) -> dict[str, Any]:
    email = email.lower()
    configured = DEMO_PASSWORDS.get(email)
    if not configured or configured[0] != password:
        raise HTTPException(status_code=401, detail="invalid_credentials")
    user_id, role = configured[1], configured[2]
    table = get_table("USERS_TABLE")
    item = table.get_item(Key={"userId": user_id}).get("Item")
    if not item:
        item = {"userId": user_id, "email": email, "role": role, "tenantId": "demo", "displayName": email}
    return item


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=401, detail="missing_token")
    return verify_token(credentials.credentials)


def is_admin(user: dict[str, Any]) -> bool:
    return user.get("role") == "admin"
