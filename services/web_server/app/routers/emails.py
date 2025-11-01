from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlmodel import select, or_, desc, asc
from ..database import get_session
from ..models import Email
from ..schemas import PaginatedEmails, EmailOut

router = APIRouter(prefix="/api/emails", tags=["emails"])

@router.get("", response_model=PaginatedEmails)
def list_emails(
    q: Optional[str] = Query(default=None, description="Search in sender/recipient/subject"),
    category: Optional[str] = Query(default=None),
    verdict: Optional[str] = Query(default=None),
    sort: str = Query(default="newest", pattern="^(newest|oldest)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=8, ge=1, le=100),
    session = Depends(get_session),
):
    # Base query
    stmt = select(Email)

    # Search in sender / recipient / subject
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                Email.sender.ilike(like),
                Email.recipient.ilike(like),
                Email.subject.ilike(like),
            )
        )

    # Optional filters
    if category:
        stmt = stmt.where(Email.category == category)
    if verdict:
        stmt = stmt.where(Email.verdict == verdict)

    # Total count
    total = len(session.exec(stmt).all())

    # Ordering
    order_by = desc(Email.created_at) if sort == "newest" else asc(Email.created_at)

    # Pagination
    offset = (page - 1) * page_size
    rows = session.exec(
        stmt.order_by(order_by).offset(offset).limit(page_size)
    ).all()

    items = [
        EmailOut(
            id=r.id,
            email_id=r.email_id or r.id,
            sender=r.sender,
            recipient=r.recipient,
            subject=r.subject,
            category=r.category,
            verdict=r.verdict,
        )
        for r in rows
    ]
    return {"items": items, "total": total, "page": page, "page_size": page_size}
