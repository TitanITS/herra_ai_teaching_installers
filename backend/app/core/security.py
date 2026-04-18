import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any, Dict

from app.core.config import settings


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100_000,
    )
    return (
        base64.b64encode(salt).decode("utf-8")
        + "$"
        + base64.b64encode(derived_key).decode("utf-8")
    )


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        salt_b64, derived_key_b64 = hashed_password.split("$", 1)
        salt = base64.b64decode(salt_b64.encode("utf-8"))
        expected_derived_key = base64.b64decode(derived_key_b64.encode("utf-8"))
    except Exception:
        return False

    test_derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100_000,
    )
    return hmac.compare_digest(test_derived_key, expected_derived_key)


def create_signed_token(payload: Dict[str, Any], expires_minutes: int | None = None) -> str:
    token_payload = payload.copy()
    token_payload["exp"] = int(time.time()) + 60 * (
        expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload_bytes = json.dumps(
        token_payload,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")

    signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest().encode("utf-8")

    token = base64.urlsafe_b64encode(payload_bytes + b"." + signature).decode("utf-8")
    return token


def decode_signed_token(token: str) -> Dict[str, Any]:
    try:
        decoded = base64.urlsafe_b64decode(token.encode("utf-8"))
        payload_bytes, signature = decoded.rsplit(b".", 1)
    except Exception as exc:
        raise ValueError("Invalid token format.") from exc

    expected_signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest().encode("utf-8")

    if not hmac.compare_digest(signature, expected_signature):
        raise ValueError("Invalid token signature.")

    payload = json.loads(payload_bytes.decode("utf-8"))

    exp = payload.get("exp")
    if not isinstance(exp, int) or exp < int(time.time()):
        raise ValueError("Token has expired.")

    return payload