from sqlalchemy.orm import Session

from app.models.user import User
from app.security.passwords import hash_password, verify_password


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower()).first()


def create_user(db: Session, name: str, email: str, password: str) -> User:
    user = User(name=name.strip(), email=email.lower().strip(), hashed_password=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_password(db: Session, email: str, password: str) -> tuple[User | None, bool]:
    """Returns (user_or_None, password_correct). A None user with
    password_correct=False means the email wasn't found — the caller
    should not distinguish this from a wrong password in user-facing
    messages (avoid leaking which emails are registered)."""
    user = get_user_by_email(db, email)
    if user is None:
        return None, False
    return user, verify_password(password, user.hashed_password)
