from threading import Lock
from time import monotonic

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import (
    DUMMY_PASSWORD_HASH, hash_password, issue_session, password_hasher, revoke_session,
    session_cookie, verify_password,
)
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])
attempt_lock = Lock()
attempts: dict[str, int] = {}
window_ends = 0.0
total_attempts = 0


def limit_attempts(request: Request):
    """Limit password hashing work per client and across the local server."""
    global window_ends, total_attempts
    client = request.client.host if request.client else "unknown"
    with attempt_lock:
        now = monotonic()
        if now >= window_ends:
            window_ends = now + 60
            attempts.clear()
            total_attempts = 0
        if total_attempts >= 60 or attempts.get(client, 0) >= 12:
            raise HTTPException(
                status_code=429,
                detail="Too many attempts. Try again shortly.",
                headers={"Retry-After": str(max(1, int(window_ends - now) + 1))},
            )
        attempts[client] = attempts.get(client, 0) + 1
        total_attempts += 1


@router.post("/signup", status_code=204, dependencies=[Depends(limit_attempts)])
def signup(user: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    new_user = models.User(
        username=user.username,
        hashed_password=hash_password(user.password),
        bodyweight=user.bodyweight,
    )
    db.add(new_user)
    response = Response(status_code=204)
    try:
        db.flush()
        issue_session(request, response, db, new_user)
    except IntegrityError:
        db.rollback()
        if db.query(models.User.id).filter_by(username=user.username).first():
            raise HTTPException(status_code=409, detail="Username already registered.")
        raise
    return response


@router.post("/login", status_code=204, dependencies=[Depends(limit_attempts)])
def login(credentials: schemas.Credentials, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(username=credentials.username).first()
    password_hash = user.hashed_password if user else DUMMY_PASSWORD_HASH
    if not verify_password(credentials.password, password_hash) or not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password.")

    if not password_hash.startswith("$argon2") or password_hasher.check_needs_rehash(password_hash):
        user.hashed_password = hash_password(credentials.password)
    response = Response(status_code=204)
    issue_session(request, response, db, user)
    return response


@router.post("/logout", status_code=204)
def logout(request: Request, db: Session = Depends(get_db)):
    revoke_session(request, db)
    db.commit()
    response = Response(status_code=204)
    name, secure = session_cookie(request)
    response.delete_cookie(name, httponly=True, secure=secure, samesite="strict")
    return response
