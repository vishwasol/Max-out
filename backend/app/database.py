import os
from pathlib import Path
from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

database_url = make_url(os.getenv("DATABASE_URL", "sqlite:///maxout.db"))

if database_url.get_backend_name() == "sqlite":
    if database_url.database not in (None, "", ":memory:"):
        database_path = BACKEND_DIR / database_url.database
        database_path.touch(mode=0o600, exist_ok=True)
        database_path.chmod(0o600)
        database_url = database_url.set(database=str(database_path))
    engine = create_engine(
        database_url, connect_args={"check_same_thread": False}, hide_parameters=True
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_options(connection, record):
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA secure_delete=ON")
else:
    engine = create_engine(database_url, hide_parameters=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def run_migrations():
    """Apply lightweight schema fixes for local SQLite development."""
    inspector = inspect(engine)

    if "workouts" not in inspector.get_table_names():
        return

    workout_columns = {column["name"] for column in inspector.get_columns("workouts")}
    if "points_earned" in workout_columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE workouts ADD COLUMN points_earned INTEGER NOT NULL DEFAULT 0")
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
