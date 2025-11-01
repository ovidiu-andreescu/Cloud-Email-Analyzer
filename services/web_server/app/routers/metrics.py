from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from sqlmodel import select, func
from ..database import get_session
from ..models import User, Email
from ..schemas import Metrics

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

def _pct_delta(curr: int, prev: int) -> float:
    if prev == 0:
        return 100.0 if curr > 0 else 0.0
    return (curr - prev) * 100.0 / prev

@router.get("", response_model=Metrics)
def get_metrics(session = Depends(get_session)):
    # Totals
    total_users = session.exec(select(func.count()).select_from(User)).one()
    total_emails = session.exec(select(func.count()).select_from(Email)).one()

    # "Active now" = users active in last 30 minutes
    now = datetime.utcnow()
    active_window = now - timedelta(minutes=30)
    active_now = session.exec(
        select(func.count()).select_from(User).where(User.last_active_at >= active_window)
    ).one()

    # Delta 1: active users this month vs previous month
    # (30-day windows to avoid month-length corner cases)
    curr_start = now - timedelta(days=30)
    prev_start = now - timedelta(days=60)
    prev_end   = curr_start

    active_curr = session.exec(
        select(func.count()).select_from(User).where(User.last_active_at >= curr_start)
    ).one()
    active_prev = session.exec(
        select(func.count()).select_from(User).where(
            (User.last_active_at >= prev_start) & (User.last_active_at < prev_end)
        )
    ).one()
    active_this_month_delta_pct = _pct_delta(active_curr, active_prev)

    # Delta 2: emails this week vs previous week
    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)
    prev_week_end = week_start

    emails_curr_week = session.exec(
        select(func.count()).select_from(Email).where(Email.created_at >= week_start)
    ).one()
    emails_prev_week = session.exec(
        select(func.count()).select_from(Email).where(
            (Email.created_at >= prev_week_start) & (Email.created_at < prev_week_end)
        )
    ).one()
    emails_this_week_delta_pct = _pct_delta(emails_curr_week, emails_prev_week)

    return {
        "total_users": int(total_users),
        "total_emails": int(total_emails),
        "active_now": int(active_now),
        "active_this_month_delta_pct": float(active_this_month_delta_pct),
        "emails_this_week_delta_pct": float(emails_this_week_delta_pct),
    }
