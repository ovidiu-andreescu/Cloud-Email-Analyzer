from pydantic import BaseModel
from fastapi import APIRouter, Depends

from ..auth import authenticate, current_user, issue_token


router = APIRouter(tags=["auth"])


class LoginIn(BaseModel):
    email: str
    password: str


@router.post("/auth/login")
def login(payload: LoginIn):
    user = authenticate(payload.email, payload.password)
    return {"accessToken": issue_token(user), "user": user}


@router.get("/me")
def me(user=Depends(current_user)):
    return user
