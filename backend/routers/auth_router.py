from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.auth import hash_password, verify_password, create_access_token, get_current_user
from backend.database import get_db
from backend.models import User
from backend.schemas import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.post("/seed", response_model=UserResponse)
def seed_admin(db: Session = Depends(get_db)):
    """Create the initial admin user. Only works if no users exist."""
    if db.query(User).count() > 0:
        raise HTTPException(status_code=400, detail="Users already exist")
    admin = User(
        username="admin",
        password_hash=hash_password("admin123"),
        full_name="Admin User",
        role="admin",
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin
