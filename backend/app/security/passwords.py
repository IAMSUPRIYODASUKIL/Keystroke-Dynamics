"""Password hashing. Uses Argon2 (winner of the Password Hashing
Competition) via passlib — never store or compare plaintext passwords."""
from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return _pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        # Malformed hash — treat as a failed verification, not a crash.
        return False
