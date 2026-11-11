from contextlib import asynccontextmanager
import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.staticfiles import StaticFiles

from . import models
from .auth import LOCAL_HOSTS
from .database import Base, SessionLocal, engine, run_migrations
from .routers import auth, performance, upgrades, users, workouts
from .security import RequestProtection

def seed_data():
    """Seed the initial upgrade catalog on first start."""
    db = SessionLocal()
    try:
        # Upgrade catalog
        if db.query(models.Upgrade).count() == 0:
            catalog = [
                models.Upgrade(
                    name="PR Boost",
                    description="+10% bonus points whenever you hit a personal record.",
                    effect_type="pr_multiplier",
                    value=1.1,
                    cost=50,
                ),
                models.Upgrade(
                    name="Streak Shield",
                    description="Preserve your streak if you miss a single day.",
                    effect_type="streak_shield",
                    value=1.0,
                    cost=75,
                ),
                models.Upgrade(
                    name="Volume Amplifier",
                    description="+5 flat bonus points added to every workout you log.",
                    effect_type="volume_bonus",
                    value=5.0,
                    cost=100,
                ),
                models.Upgrade(
                    name="Weekend Warrior",
                    description="2× points on all workouts completed on weekends.",
                    effect_type="weekend_multiplier",
                    value=2.0,
                    cost=150,
                ),
            ]
            db.add_all(catalog)
            db.commit()
    finally:
        db.close()



@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_migrations()
    seed_data()
    yield


demo = os.getenv("MAXOUT_DEMO") == "1"
app = FastAPI(
    title="Max-out API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if demo else "/docs",
    redoc_url=None if demo else "/redoc",
    openapi_url=None if demo else "/openapi.json",
)
app.state.local_http = os.getenv("MAXOUT_LOCAL_HTTP") == "1"
allowed_hosts = [host.strip() for host in os.getenv("MAXOUT_HOSTS", "").split(",") if host.strip()]
app.add_middleware(TrustedHostMiddleware, allowed_hosts=[*LOCAL_HOSTS, *allowed_hosts])
app.add_middleware(RequestProtection, demo=demo)

for router in (auth.router, workouts.router, performance.router, upgrades.router, users.router):
    app.include_router(router, prefix="/api")
    if not demo:
        app.include_router(router, include_in_schema=False)


@app.exception_handler(RequestValidationError)
async def invalid_input(request: Request, exc: RequestValidationError):
    return JSONResponse({"detail": "Invalid input. Check the form fields and try again."}, status_code=422)


if demo:
    dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
    app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/")
    @app.get("/login")
    @app.get("/signup")
    @app.get("/log")
    @app.get("/progress")
    @app.get("/upgrades")
    def frontend():
        return FileResponse(dist / "index.html", headers={"Cache-Control": "no-cache"})

    @app.get("/favicon.svg")
    def favicon():
        return FileResponse(dist / "favicon.svg")
else:
    @app.get("/")
    def root():
        return {"message": "Max-out API running 🏋️", "docs": "/docs"}
