import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any

from boto3.dynamodb.conditions import Attr
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services_common.aws_helper import get_table


security = HTTPBearer(auto_error=False)


def _jwt_secret() -> bytes:
    secret = os.getenv("JWT_SECRET")
    stage = os.getenv("STAGE", os.getenv("ENV", "local-dev"))
    if not secret and stage not in {"local-dev", "test"}:
        raise RuntimeError("JWT_SECRET must be set outside local/test environments")
    return (secret or "local-demo-secret").encode("utf-8")


JWT_SECRET = _jwt_secret()
PASSWORD_ALGORITHM = "pbkdf2_sha256"
SENSITIVE_USER_FIELDS = {
    "passwordAlgorithm",
    "passwordHash",
    "passwordIterations",
    "passwordSalt",
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


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in user.items() if key not in SENSITIVE_USER_FIELDS}


def _find_user_by_email(email: str) -> dict[str, Any] | None:
    table = get_table("USERS_TABLE")
    response = table.scan(FilterExpression=Attr("email").eq(email))
    items = response.get("Items", [])
    while response.get("LastEvaluatedKey"):
        response = table.scan(
            FilterExpression=Attr("email").eq(email),
            ExclusiveStartKey=response["LastEvaluatedKey"],
        )
        items.extend(response.get("Items", []))

    for item in items:
        if item.get("email", "").lower() == email and item.get("status", "ACTIVE") == "ACTIVE":
            return item
    return None


def _find_user_by_id(user_id: str) -> dict[str, Any] | None:
    item = get_table("USERS_TABLE").get_item(Key={"userId": user_id}).get("Item")
    if item and item.get("status", "ACTIVE") == "ACTIVE":
        return item
    return None


def _password_hash(password: str, salt: str, iterations: int) -> str:
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    return base64.b64encode(digest).decode("ascii")


def authenticate(email: str, password: str) -> dict[str, Any]:
    email = email.strip().lower()
    item = _find_user_by_email(email)
    if not item:
        raise HTTPException(status_code=401, detail="invalid_credentials")

    algorithm = item.get("passwordAlgorithm")
    expected_hash = item.get("passwordHash")
    salt = item.get("passwordSalt")
    iterations = int(item.get("passwordIterations", 0) or 0)
    if algorithm != PASSWORD_ALGORITHM or not expected_hash or not salt or iterations <= 0:
        raise HTTPException(status_code=401, detail="invalid_credentials")

    actual_hash = _password_hash(password, salt, iterations)
    if not hmac.compare_digest(expected_hash, actual_hash):
        raise HTTPException(status_code=401, detail="invalid_credentials")
    return public_user(item)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=401, detail="missing_token")
    payload = verify_token(credentials.credentials)
    live_user = _find_user_by_id(payload.get("sub", ""))
    if not live_user:
        raise HTTPException(status_code=401, detail="user_inactive")
    return public_user(live_user)


def is_admin(user: dict[str, Any]) -> bool:
    return user.get("role") == "admin"
