from types import SimpleNamespace

import jwt
import pytest
from fastapi import HTTPException

from dependencies import verify_admin_role

SECRET = "unit-test-jwt-secret-0123456789ab"
ALGO = "HS256"


def _creds(payload, secret=SECRET, algorithm=ALGO):
    token = jwt.encode(payload, secret, algorithm=algorithm)
    return SimpleNamespace(credentials=token)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "role",
    ["webadmin", "webmaster", "admin", "dean", "director", "coe"],
)
async def test_allowed_roles_return_the_payload(role):
    payload = await verify_admin_role(_creds({"username": "ada", "role": role}))
    assert payload["username"] == "ada"
    assert payload["role"] == role


@pytest.mark.asyncio
async def test_missing_identity_is_unauthorized():
    with pytest.raises(HTTPException) as exc:
        await verify_admin_role(_creds({"role": "admin"}))
    assert exc.value.status_code == 401
    assert "missing username or role" in exc.value.detail

    with pytest.raises(HTTPException) as exc:
        await verify_admin_role(_creds({"username": "ada"}))
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_student_role_is_forbidden():
    with pytest.raises(HTTPException) as exc:
        await verify_admin_role(_creds({"username": "stu", "role": "student"}))
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_bad_signature_or_expired_token_is_unauthorized():
    with pytest.raises(HTTPException) as exc:
        await verify_admin_role(
            _creds(
                {"username": "ada", "role": "admin"},
                secret="other-secret-not-the-signing-key",
            )
        )
    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid or expired token"

    expired = jwt.encode(
        {"username": "ada", "role": "admin", "exp": 1},
        SECRET,
        algorithm=ALGO,
    )
    with pytest.raises(HTTPException) as exc:
        await verify_admin_role(SimpleNamespace(credentials=expired))
    assert exc.value.status_code == 401
