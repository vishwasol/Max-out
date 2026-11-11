from pydantic import BaseModel, ConfigDict, Field
from typing import Annotated, List, Optional, Dict, Any
from datetime import datetime


# ─── Exercise ────────────────────────────────────────────────────────────────

class ExerciseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    weight: float = Field(ge=0, le=5000, allow_inf_nan=False)
    reps: int = Field(ge=1, le=1000)
    sets: int = Field(ge=1, le=1000)


class ExerciseOut(BaseModel):
    name: str
    weight: float
    reps: int
    sets: int
    id: int
    workout_id: int

    model_config = ConfigDict(from_attributes=True)


# ─── Workout ─────────────────────────────────────────────────────────────────

class WorkoutCreate(BaseModel):
    notes: Optional[str] = Field(default=None, max_length=4000)
    exercises: List[ExerciseCreate] = Field(min_length=1, max_length=50)


class WorkoutOut(BaseModel):
    id: int
    user_id: int
    date: datetime
    notes: Optional[str]
    exercises: List[ExerciseOut]
    points_earned: int = 0

    model_config = ConfigDict(from_attributes=True)


class WorkoutResult(BaseModel):
    workout: WorkoutOut
    points_earned: int
    breakdown: Dict[str, Any]
    is_pr: bool
    streak: int
    level_up: bool
    new_level: int
    new_total_points: int


# ─── Performance ─────────────────────────────────────────────────────────────

class PerformanceOut(BaseModel):
    user_id: int
    streak: int
    prs: Dict[str, float]
    total_volume: float
    workouts_count: int


# ─── Upgrade ─────────────────────────────────────────────────────────────────

class UpgradeOut(BaseModel):
    id: int
    name: str
    description: str
    effect_type: str
    value: float
    cost: int
    count: int = 0

    model_config = ConfigDict(from_attributes=True)


class UnlockRequest(BaseModel):
    upgrade_id: int


class UnlockResult(BaseModel):
    success: bool
    message: str
    remaining_points: int


# ─── Auth / User ──────────────────────────────────────────────────────────────
Bodyweight = Annotated[float, Field(gt=0, le=2000, allow_inf_nan=False)]


class Credentials(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=256)


class UserCreate(Credentials):
    username: str = Field(min_length=1, max_length=64, pattern=r"^[^\s]+$")
    password: str = Field(min_length=12, max_length=256)
    bodyweight: Bodyweight


class UserBodyweightUpdate(BaseModel):
    bodyweight: Bodyweight


class UserOut(BaseModel):
    id: int
    username: str
    total_points: int
    level: int
    bodyweight: float

    model_config = ConfigDict(from_attributes=True)
