from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user
from ..engines.performance_engine import get_streak, get_prs, calculate_volume

router = APIRouter(prefix="/performance", tags=["performance"])


@router.get("/", response_model=schemas.PerformanceOut)
def get_performance(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return PRs, streak, total volume, and workout count for a user."""
    user_id = current_user.id

    workouts = (
        db.query(models.Workout)
        .options(selectinload(models.Workout.exercises))
        .filter(models.Workout.user_id == user_id)
        .all()
    )

    total_volume = sum(calculate_volume(w.exercises) for w in workouts)

    return schemas.PerformanceOut(
        user_id=user_id,
        streak=get_streak(db, user_id),
        prs=get_prs(db, user_id),
        total_volume=total_volume,
        workouts_count=len(workouts),
    )
