from sqlalchemy.orm import Session
from datetime import datetime
from .. import models
from .performance_engine import detect_pr, calculate_volume, get_streak, get_previous_avg_volume
from .upgrade_engine import apply_upgrades

# ─── Leveling ──────────────────────────────────────────────────────────────────
# Points required to reach each level (index = level - 1)
LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000]


def get_level(total_points: int) -> int:
    level = 1
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if total_points >= threshold:
            level = i + 1
    return min(level, len(LEVEL_THRESHOLDS))


def points_to_next_level(total_points: int) -> dict:
    """Return current threshold, next threshold, and progress percentage."""
    level = get_level(total_points)
    current_threshold = LEVEL_THRESHOLDS[level - 1]
    if level >= len(LEVEL_THRESHOLDS):
        return {"current": current_threshold, "next": current_threshold, "progress": 100.0}
    next_threshold = LEVEL_THRESHOLDS[level]
    span = next_threshold - current_threshold
    progress = ((total_points - current_threshold) / span) * 100 if span else 100.0
    return {"current": current_threshold, "next": next_threshold, "progress": round(progress, 1)}


# ─── Core Calculation ─────────────────────────────────────────────────────────

def calculate_points(
    db: Session,
    user_id: int,
    workout_id: int,
    exercises: list,
) -> dict:
    """
    Calculate points earned for a completed workout.
    Returns: { points, breakdown, is_pr, streak }
    """
    is_weekend = datetime.utcnow().weekday() >= 5
    breakdown: dict = {}

    # Base reward for completing a workout
    base = 10
    breakdown["completed_workout"] = 10

    # ── PR Detection ─────────────────────────────────────────────────────────
    is_pr = False
    for ex in exercises:
        if detect_pr(db, user_id, ex.name, ex.weight, exclude_workout_id=workout_id):
            is_pr = True
            break

    if is_pr:
        breakdown["pr_bonus"] = 20
        base += 20

    # ── Streak Bonus ─────────────────────────────────────────────────────────
    streak = get_streak(db, user_id)
    if streak >= 3:
        streak_bonus = 5 * (streak // 3)
        breakdown["streak_bonus"] = streak_bonus
        base += streak_bonus

    # ── Volume Increase Bonus ─────────────────────────────────────────────────
    current_vol = calculate_volume(exercises)
    prev_vol = get_previous_avg_volume(db, user_id, exclude_workout_id=workout_id)
    if prev_vol >= 0.01:
        pct_increase = ((current_vol - prev_vol) / prev_vol) * 100
        if pct_increase > 5:
            vol_bonus = int((pct_increase - 5) * 0.5)
            if vol_bonus > 0:
                breakdown["volume_increase_bonus"] = vol_bonus
                base += vol_bonus

    # ── Apply Upgrade Modifiers ───────────────────────────────────────────────
    context = {"is_pr": is_pr, "streak": streak, "is_weekend": is_weekend}
    final = apply_upgrades(db, user_id, base, context)

    if final != base:
        breakdown["upgrade_bonus"] = final - base

    return {"points": final, "breakdown": breakdown, "is_pr": is_pr, "streak": streak}
