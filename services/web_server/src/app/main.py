import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, messages
from mangum import Mangum

app = FastAPI(title="Email Analyzer API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
