from hashlib import sha256
from secrets import token_urlsafe
from threading import BoundedSemaphore
from time import time

import bcrypt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy import update
from sqlalchemy.orm import Session

from . import models
from .database import get_db

SESSION_SECONDS = 60 * 60
LOCAL_HOSTS = ("127.0.0.1", "localhost")
password_hasher = PasswordHasher()
DUMMY_PASSWORD_HASH = password_hasher.hash(token_urlsafe(32))


password_workers = BoundedSemaphore(4)


def hash_password(password: str) -> str:
    with password_workers:
        return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    with password_workers:
        if password_hash.startswith(("$2a$", "$2b$", "$2y$")):
            try:
                return bcrypt.checkpw(password.encode(), password_hash.encode())
            except ValueError:
                return False
        try:
            return password_hasher.verify(password_hash, password)
        except (VerificationError, InvalidHashError):
            return False

def session_cookie(request: Request) -> tuple[str, bool]:
    local_http = (
        request.app.state.local_http
        and request.url.scheme == "http"
        and request.url.hostname in LOCAL_HOSTS
    )
    return ("maxout_session", False) if local_http else ("__Host-maxout_session", True)


def session_digest(request: Request) -> str | None:
    name, _ = session_cookie(request)
    token = request.cookies.get(name, "")
    if len(token) != 43 or not token.isascii():
        return None
    return sha256(token.encode()).hexdigest()


def revoke_session(request: Request, db: Session):
    digest = session_digest(request)
    if digest:
        db.query(models.AccountSession).filter_by(token_digest=digest).delete()


def issue_session(request: Request, response: Response, db: Session, user: models.User):
    now = int(time())
    token = token_urlsafe(32)
    revoke_session(request, db)
    db.query(models.AccountSession).filter(models.AccountSession.expires_at <= now).delete()
    db.add(models.AccountSession(
        token_digest=sha256(token.encode()).hexdigest(),
        user_id=user.id,
        expires_at=now + SESSION_SECONDS,
    ))
    db.commit()

    name, secure = session_cookie(request)
    response.set_cookie(
        name, token, max_age=SESSION_SECONDS, httponly=True, secure=secure, samesite="strict"
    )


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    digest = session_digest(request)
    if digest:
        user = (
            db.query(models.User)
            .join(models.AccountSession)
            .filter(
                models.AccountSession.token_digest == digest,
                models.AccountSession.expires_at > int(time()),
            )
            .first()
        )
        if user:
            return user
    raise HTTPException(status_code=401, detail="Please log in.")


def get_user_for_write(
    user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
) -> models.User:
    # Acquire a write lock before reading the points balance on either SQLite or Postgres.
    db.execute(
        update(models.User)
        .where(models.User.id == user.id)
        .values(total_points=models.User.total_points)
    )
    db.refresh(user)
    return user
