from fastapi import Depends, HTTPException
from starlette import status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWTError as JWTError
from typing import Annotated
from config import settings


security = HTTPBearer()

WEBADMIN_EMAIL = "webadmin@rguktong.ac.in"


def _account_email(payload: dict) -> str:
    explicit = str(payload.get("email") or "").strip().lower()
    if explicit:
        return explicit
    username = str(payload.get("username") or "").replace('"', "").strip().lower()
    if not username:
        return ""
    if "@" in username:
        return username
    return f"{username}@rguktong.ac.in"


def is_webadmin(payload: dict) -> bool:
    role = str(payload.get("role") or "").strip().lower()
    return role == "webadmin" and _account_email(payload) == WEBADMIN_EMAIL


def access_role(payload: dict) -> str:
    if str(payload.get("id") or "") == "internal":
        return str(payload.get("role") or "").strip().lower()
    role = str(payload.get("role") or "").strip().lower()
    if role == "webadmin" and not is_webadmin(payload):
        return "faculty"
    return role


async def verify_admin_role(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]):
    
    token = credentials.credentials 
    
    try:
        payload = jwt.decode(token, settings.JWT_SECURITY_KEY, algorithms=[settings.JWT_ALGORITHM])
        
        user_role = payload.get("role")
        username = payload.get("username")
        
        if not username or not user_role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid token structure: missing username or role"
            )

        # Same rule as isWebadmin / accessRole in @uniz/shared.
        role = access_role(payload)
        if role not in ["webadmin", "admin", "dean", "director", "coe"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Forbidden: You do not have the required role to update data."
            )

        payload = dict(payload)
        payload["role"] = role
        return payload 
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or expired token"
        )

AdminRole = Annotated[dict, Depends(verify_admin_role)]