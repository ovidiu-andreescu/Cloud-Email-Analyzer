from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class EmailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    # id: int
    # id: Field(alias="messageId")
    # email_id: int
    messageId: str
    sender: str
    recipient: str
    subject: str
    category: Optional[str] = None
    verdict: Optional[str] = None
    virus_verdict: Optional[str] = None

class PaginatedEmails(BaseModel):
    items: list[EmailOut]
    total: int
    page: int
    page_size: int


class DynamoPaginatedEmails(BaseModel):
    items: List[EmailOut]
    limit: int
    next_token: Optional[str] = Field(default=None)


class Metrics(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_users: int
    total_emails: int
    active_now: int
    active_this_month_delta_pct: float
    emails_this_week_delta_pct: float
