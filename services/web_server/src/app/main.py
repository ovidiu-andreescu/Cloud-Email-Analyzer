import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from .database import init_db
from .routers import emails, metrics
from mangum import Mangum

app = FastAPI(title="Email Analyzer API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emails.router)
app.include_router(metrics.router)

# @app.on_event("startup")
# def on_startup():
#     init_db()

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Hello from the Email Analyzer API!"}

handler = Mangum(app)
