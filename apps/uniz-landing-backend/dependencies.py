from fastapi import Depends, HTTPException
from starlette import status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWTError as JWTError
from typing import Annotated
from config import settings


security = HTTPBearer()


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
            
        if user_role not in ["webmaster", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Forbidden: You do not have the required role to update data."
            )
            
        return payload 
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or expired token"
        )

AdminRole = Annotated[dict, Depends(verify_admin_role)]