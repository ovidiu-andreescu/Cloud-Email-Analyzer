from typing import List
from pydantic import BaseModel

class EmailOut(BaseModel):
    id: int
    email_id: int
    sender: str
    recipient: str
    subject: str
    category: str
    verdict: str

class PaginatedEmails(BaseModel):
    items: list[EmailOut]
    total: int
    page: int
    page_size: int

class Metrics(BaseModel):
    total_users: int
    total_emails: int
    active_now: int
    active_this_month_delta_pct: float
    emails_this_week_delta_pct: float
