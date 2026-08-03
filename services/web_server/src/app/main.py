import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, messages
from mangum import Mangum

app = FastAPI(title="Email Analyzer API", version="0.1.0")


def _cors_origins() -> list[str]:
    configured = os.getenv("CORS_ALLOW_ORIGINS")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    return ["http://localhost:5173", "http://127.0.0.1:5173"]


def _cors_allow_credentials() -> bool:
    return os.getenv("CORS_ALLOW_CREDENTIALS", "false").lower() in {"1", "true", "yes", "on"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=_cors_allow_credentials(),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Scan-Verdict", "X-Scan-Status", "X-ClamAV-Signature"],
)

app.include_router(auth.router)
app.include_router(messages.router)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Hello from the Email Analyzer API!"}

handler = Mangum(app)
