from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user, get_user_for_write

router = APIRouter(prefix="/upgrades", tags=["upgrades"])


@router.get("/", response_model=List[schemas.UpgradeOut])
def get_upgrades(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all upgrades, flagging which ones the user already owns."""
    user_id = current_user.id
    all_upgrades = db.query(models.Upgrade).all()
    from sqlalchemy import func
    owned_counts = {
        row.upgrade_id: row.count
        for row in db.query(
            models.UserUpgrade.upgrade_id, 
            func.count(models.UserUpgrade.id).label("count")
        )
        .filter(models.UserUpgrade.user_id == user_id)
        .group_by(models.UserUpgrade.upgrade_id)
        .all()
    }

    return [
        schemas.UpgradeOut(
            id=u.id,
            name=u.name,
            description=u.description,
            effect_type=u.effect_type,
            value=u.value,
            cost=u.cost,
            count=owned_counts.get(u.id, 0),
        )
        for u in all_upgrades
    ]


@router.post("/unlock", response_model=schemas.UnlockResult)
def unlock_upgrade(
    req: schemas.UnlockRequest, 
    current_user: models.User = Depends(get_user_for_write),
    db: Session = Depends(get_db)
):
    """Spend points to unlock an upgrade."""
    user = current_user

    upgrade = db.query(models.Upgrade).filter(models.Upgrade.id == req.upgrade_id).first()
    if not upgrade:
        raise HTTPException(status_code=404, detail="Upgrade not found")

    # Enough points?
    if user.total_points < upgrade.cost:
        return schemas.UnlockResult(
            success=False,
            message=f"Need {upgrade.cost} pts — you have {user.total_points}.",
            remaining_points=user.total_points,
        )

    # Deduct and grant
    user.total_points -= upgrade.cost
    db.add(models.UserUpgrade(user_id=user.id, upgrade_id=req.upgrade_id))
    db.commit()

    return schemas.UnlockResult(
        success=True,
        message=f"'{upgrade.name}' unlocked! 🎉",
        remaining_points=user.total_points,
    )
