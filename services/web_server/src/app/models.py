# from typing import Optional
# from datetime import datetime
# from sqlmodel import SQLModel, Field
#
# class User(SQLModel, table=True):
#     id: Optional[int] = Field(default=None, primary_key=True)
#     email: str
#     is_active: bool = True
#     last_active_at: datetime = Field(default_factory=datetime.utcnow)
#
# class Email(SQLModel, table=True):
#     id: Optional[int] = Field(default=None, primary_key=True, alias="email_id")
#     email_id: Optional[int] = Field(default=None)
#     sender: str
#     recipient: str
#     subject: str
#     category: str
#     verdict: str
#     created_at: datetime = Field(default_factory=datetime.utcnow)
