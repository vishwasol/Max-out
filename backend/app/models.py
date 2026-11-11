from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    total_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    bodyweight = Column(Float, default=180.0)

    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")
    user_upgrades = relationship("UserUpgrade", back_populates="user")


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String, nullable=True)
    points_earned = Column(Integer, default=0)

    user = relationship("User", back_populates="workouts")
    exercises = relationship("Exercise", back_populates="workout", cascade="all, delete-orphan")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    name = Column(String, index=True)
    weight = Column(Float)
    reps = Column(Integer)
    sets = Column(Integer)

    workout = relationship("Workout", back_populates="exercises")


class Upgrade(Base):
    __tablename__ = "upgrades"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(String)
    effect_type = Column(String)  # pr_multiplier | streak_shield | volume_bonus | weekend_multiplier
    value = Column(Float)
    cost = Column(Integer)

    user_upgrades = relationship("UserUpgrade", back_populates="upgrade")


class UserUpgrade(Base):
    __tablename__ = "user_upgrades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    upgrade_id = Column(Integer, ForeignKey("upgrades.id"))
    acquired_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="user_upgrades")
    upgrade = relationship("Upgrade", back_populates="user_upgrades")


class AccountSession(Base):
    __tablename__ = "account_sessions"

    token_digest = Column(String(64), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    expires_at = Column(Integer, nullable=False, index=True)
