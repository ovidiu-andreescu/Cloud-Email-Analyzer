from pydantic import BaseModel
from fastapi import APIRouter, Depends

from ..auth import authenticate, current_user, issue_token
from ..audit import write_audit


router = APIRouter(tags=["auth"])


class LoginIn(BaseModel):
    email: str
    password: str


@router.post("/auth/login")
def login(payload: LoginIn):
    user = authenticate(payload.email, payload.password)
    write_audit(actor=user, action="auth.login.success")
    return {"accessToken": issue_token(user), "user": user}


@router.get("/me")
def me(user=Depends(current_user)):
    return user
