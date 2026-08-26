"""FastAPI dependency for extracting the current authenticated user from a
bearer token."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.security.tokens import decode_access_token

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    payload = decode_access_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise unauthorized

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if user is None or not user.is_active:
        raise unauthorized
    return user
