from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

from ..auth import get_current_user, get_user_for_write

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserOut)
def get_user(current_user: models.User = Depends(get_current_user)):
    """Return current user stats including points and level."""
    return current_user


@router.put("/me/bodyweight", response_model=schemas.UserOut)
def update_bodyweight(
    req: schemas.UserBodyweightUpdate, 
    current_user: models.User = Depends(get_user_for_write),
    db: Session = Depends(get_db)
):
    """Update user bodyweight."""
    current_user.bodyweight = req.bodyweight
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me/reset")
def reset_user(current_user: models.User = Depends(get_user_for_write), db: Session = Depends(get_db)):
    """Wipe all user data for testing purposes."""
    for workout in current_user.workouts:
        db.delete(workout)
    
    # Delete user upgrades
    db.query(models.UserUpgrade).filter(models.UserUpgrade.user_id == current_user.id).delete()

    # Reset points and level
    current_user.total_points = 0
    current_user.level = 1

    db.commit()
    return {"status": "success", "message": "User data successfully reset."}
