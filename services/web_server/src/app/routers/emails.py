from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional
# from sqlmodel import select, or_, desc, asc
# from ..database import get_session
# from ..models import Email
from ..schemas import PaginatedEmails, EmailOut, DynamoPaginatedEmails
from services_common.aws_helper import get_ddb, get_table
from ..dynamodb import get_email_table
from typing import Any, Dict, List, Optional, Tuple
from boto3.dynamodb.conditions import Attr, Or, And

router = APIRouter(prefix="/api/emails", tags=["emails"])

# @router.get("", response_model=PaginatedEmails)
# def list_emails(
#     q: Optional[str] = Query(default=None, description="Search in sender/recipient/subject"),
#     category: Optional[str] = Query(default=None),
#     verdict: Optional[str] = Query(default=None),
#     sort: str = Query(default="newest", pattern="^(newest|oldest)$"),
#     page: int = Query(default=1, ge=1),
#     page_size: int = Query(default=8, ge=1, le=100),
#     session = Depends(get_session),
# ):
#     # Base query
#     stmt = select(Email)
#     table = get_email_table()
#
#     # Search in sender / recipient / subject
#     if q:
#         like = f"%{q}%"
#         stmt = stmt.where(
#             or_(
#                 Email.sender.ilike(like),
#                 Email.recipient.ilike(like),
#                 Email.subject.ilike(like),
#             )
#         )
#
#     # Optional filters
#     if category:
#         stmt = stmt.where(Email.category == category)
#     if verdict:
#         stmt = stmt.where(Email.verdict == verdict)
#
#     # Total count
#     total = len(session.exec(stmt).all())
#
#     # Ordering
#     order_by = desc(Email.created_at) if sort == "newest" else asc(Email.created_at)
#
#     # Pagination
#     offset = (page - 1) * page_size
#     rows = session.exec(
#         stmt.order_by(order_by).offset(offset).limit(page_size)
#     ).all()
#
#     items = [
#         EmailOut(
#             id=r.id,
#             email_id=r.email_id or r.id,
#             sender=r.sender,
#             recipient=r.recipient,
#             subject=r.subject,
#             category=r.category,
#             verdict=r.verdict,
#         )
#         for r in rows
#     ]
#     return {"items": items, "total": total, "page": page, "page_size": page_size}

def _build_filter(
        q: Optional[str],
        category: Optional[str],
        verdict: Optional[str]
) -> Optional[Attr]:
    final_filter: Optional[Attr] = Attr("subject").exists()

    if category and category.strip():
        f_cat = Attr("category").eq(category.strip())
        final_filter = And(final_filter, f_cat)

    if verdict and verdict.strip():
        f_verd = Attr("verdict").eq(verdict.strip())
        final_filter = And(final_filter, f_verd)

    if q and q.strip():
        tokens = [t.strip() for t in q.replace(",", " ").split() if t.strip()]
        kw_exprs = []
        for t in tokens:
            # DynamoDB 'contains' is case-sensitive
            kw_exprs.append(Attr("subject").contains(t))
            kw_exprs.append(Attr("sender").contains(t))
            kw_exprs.append(Attr("recipient").contains(t))

        if kw_exprs:
            f_search = kw_exprs[0]
            for e in kw_exprs[1:]:
                f_search = Or(f_search, e)

            final_filter = And(final_filter, f_search)

    return final_filter



def _scan_with_filter(
        table: Any,
        FilterExpression: Optional[Attr],
        Limit: int = 1000
) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []

    kwargs: Dict[str, Any] = {
        "FilterExpression": FilterExpression
    }

    while True:
        resp = table.scan(**kwargs)
        items.extend(resp.get("Items", []))

        if "LastEvaluatedKey" not in resp or len(items) >= Limit:
            break

        kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]

    return items[:Limit]


@router.get("", response_model=PaginatedEmails)
def list_emails(
        q: Optional[str] = Query(None, description="e.g. 'python, invoice'"),
        category: Optional[str] = Query(None, description="e.g. 'Spam'"),
        verdict: Optional[str] = Query(None, description="e.g. 'Unsafe'"),
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),

        table=Depends(lambda: get_table("LEDGER_TABLE")),
):
    try:
        filt = _build_filter(q, category, verdict)
        superset_limit = max(page * page_size, 200)
        rows = _scan_with_filter(table, filt, Limit=superset_limit)

        total = len(rows)
        start_index = (page - 1) * page_size
        end_index = start_index + page_size

        page_items = [EmailOut.model_validate(it) for it in rows[start_index:end_index]]

        return {
            "items": page_items,
            "total": total,
            "page": page,
            "page_size": page_size
        }

    except Exception as e:
        print(f"[emails-scan] {type(e).__name__}: {e}", flush=True)
        raise HTTPException(status_code=500, detail="email_list_failed")