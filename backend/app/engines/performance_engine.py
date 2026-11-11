from sqlalchemy.orm import Session, selectinload
from datetime import date, datetime, timedelta, timezone
from .. import models


def detect_pr(db: Session, user_id: int, exercise_name: str, weight: float, exclude_workout_id: int) -> bool:
    """Return True if this weight is a new personal record for the exercise."""
    past = (
        db.query(models.Exercise)
        .join(models.Workout)
        .filter(
            models.Workout.user_id == user_id,
            models.Workout.id != exclude_workout_id,
            models.Exercise.name == exercise_name,
        )
        .all()
    )
    if not past:
        return False  # No history → can't be a PR yet
    return weight > max(e.weight for e in past)


def calculate_volume(exercises) -> float:
    """Total volume = Σ (weight × reps × sets) across all exercises."""
    return sum(e.weight * e.reps * e.sets for e in exercises)


def _local_date(timestamp: datetime) -> date:
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    return timestamp.astimezone().date()


def get_streak(db: Session, user_id: int) -> int:
    """Count workout days, using each eligible shield to bridge one isolated missed day."""
    workout_dates = {
        _local_date(timestamp)
        for (timestamp,) in db.query(models.Workout.date).filter_by(user_id=user_id)
    }
    if not workout_dates:
        return 0

    shield_dates = sorted(
        _local_date(acquired_at)
        for (acquired_at,) in (
            db.query(models.UserUpgrade.acquired_at)
            .join(models.Upgrade)
            .filter(models.UserUpgrade.user_id == user_id, models.Upgrade.effect_type == "streak_shield")
        )
    )

    day = timedelta(days=1)
    today = datetime.now().date()
    check = today if today in workout_dates else today - day
    streak = 0

    while True:
        if check in workout_dates:
            streak += 1
        elif check - day in workout_dates:
            # A shield bought after a missed day cannot restore that gap.
            while shield_dates and shield_dates[-1] > check:
                shield_dates.pop()
            if not shield_dates:
                break
            shield_dates.pop()
        else:
            break
        check -= day

    return streak


def get_previous_avg_volume(db: Session, user_id: int, exclude_workout_id: int, limit: int = 5) -> float:
    """Average volume of the user's last N workouts (excluding the current one)."""
    past_workouts = (
        db.query(models.Workout)
        .options(selectinload(models.Workout.exercises))
        .filter(
            models.Workout.user_id == user_id,
            models.Workout.id != exclude_workout_id,
        )
        .order_by(models.Workout.date.desc())
        .limit(limit)
        .all()
    )
    if not past_workouts:
        return 0.0

    volumes = [calculate_volume(w.exercises) for w in past_workouts]
    return sum(volumes) / len(volumes) if volumes else 0.0


def get_prs(db: Session, user_id: int) -> dict:
    """Return the best (heaviest) weight ever lifted per exercise for the user."""
    exercises = (
        db.query(models.Exercise)
        .join(models.Workout)
        .filter(models.Workout.user_id == user_id)
        .all()
    )
    prs: dict = {}
    for ex in exercises:
        if ex.name not in prs or ex.weight > prs[ex.name]:
            prs[ex.name] = ex.weight
    return prs
