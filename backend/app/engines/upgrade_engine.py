from sqlalchemy.orm import Session
from .. import models


# Effect handler registry: (base_points, upgrade_value, context) → bonus_points
UPGRADE_EFFECTS = {
    # +N% points when a PR is hit
    "pr_multiplier": lambda base, value, ctx: int(base * (value - 1.0)) if ctx.get("is_pr") else 0,
    # Flat bonus points added to every workout
    "volume_bonus": lambda base, value, ctx: int(value),
    # 2× points on weekends
    "weekend_multiplier": lambda base, value, ctx: int(base * (value - 1.0)) if ctx.get("is_weekend") else 0,
}


def apply_upgrades(db: Session, user_id: int, base_points: int, context: dict) -> int:
    """
    Fetch all upgrades owned by the user and apply their effects to base_points.
    context keys: is_pr (bool), streak (int), is_weekend (bool)
    Returns the adjusted final point total.
    """
    user_upgrades = (
        db.query(models.UserUpgrade)
        .join(models.Upgrade)
        .filter(models.UserUpgrade.user_id == user_id)
        .all()
    )

    bonus = 0
    for uu in user_upgrades:
        upgrade = uu.upgrade
        handler = UPGRADE_EFFECTS.get(upgrade.effect_type)
        if handler:
            bonus += handler(base_points, upgrade.value, context)

    return base_points + bonus
