from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from jwt import PyJWTError as JWTError

from config import settings
from dependencies import is_webadmin

router = APIRouter(prefix="/api/preview", tags=["Preview"])

bearer = HTTPBearer(auto_error=False)


@router.get("/session")
async def preview_session(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
):
    """Preview editing is available only to the webadmin account.

    A missing, expired, or non-webadmin token never enables edit mode.
    The response carries no site content.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="A webadmin token is required")
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECURITY_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if not isinstance(payload, dict) or not is_webadmin(payload):
        raise HTTPException(
            status_code=403,
            detail="Preview is limited to the webadmin account",
        )
    return {"ok": True, "role": "webadmin"}
