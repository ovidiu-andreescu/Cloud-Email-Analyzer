import os
from typing import Any, Optional
from boto3.dynamodb.conditions import Attr, Or, And
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta, timezone
# from sqlmodel import select, func
# from ..database import get_session
from ..dynamodb import get_email_table, get_user_table
# from ..models import User, Email
from ..schemas import Metrics
from services_common.aws_helper import get_table
import boto3

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

try:
    LEDGER_TABLE_NAME = os.environ["LEDGER_TABLE"]
    USERS_TABLE_NAME = os.environ["USERS_TABLE"]

    EMAIL_DATE_GSI = "by-date-gsi"
    EMAIL_GSI_PK_VALUE = "EMAILS"

    USER_ACTIVITY_GSI = "by-activity-gsi"
    USER_GSI_PK_VALUE = "USERS"
except KeyError as e:
    raise RuntimeError(f"Missing required environment variable: {e}")

def _pct_delta(curr: int, prev: int) -> float:
    if prev == 0:
        return 100.0 if curr > 0 else 0.0
    return (curr - prev) * 100.0 / prev

def _get_count_in_range(
        table: Any,
        index_name: str,
        gsi_pk_value: str,
        timestamp_key: str,
        start_time: datetime,
        end_time: datetime
) -> int:
    try:
        response = table.query(
            IndexName=index_name,
            Select='COUNT',
            KeyConditionExpression=f"gsi_pk = :pk AND {timestamp_key} BETWEEN :start AND :end",
            ExpressionAttributeValues={
                ":pk": gsi_pk_value,
                ":start": start_time.isoformat(),
                ":end": end_time.isoformat()
            }
        )
        return response.get('Count', 0)
    except Exception as e:
        print(f"Error querying GSI count: {e}")
        return 0


# @router.get("", response_model=Metrics)
# def get_metrics(session = Depends(get_session)):
#     # Totals
#     total_users = session.exec(select(func.count()).select_from(User)).one()
#     total_emails = session.exec(select(func.count()).select_from(Email)).one()
#
#     # "Active now" = users active in last 30 minutes
#     now = datetime.utcnow()
#     active_window = now - timedelta(minutes=30)
#     active_now = session.exec(
#         select(func.count()).select_from(User).where(User.last_active_at >= active_window)
#     ).one()
#
#     # Delta 1: active users this month vs previous month
#     # (30-day windows to avoid month-length corner cases)
#     curr_start = now - timedelta(days=30)
#     prev_start = now - timedelta(days=60)
#     prev_end   = curr_start
#
#     active_curr = session.exec(
#         select(func.count()).select_from(User).where(User.last_active_at >= curr_start)
#     ).one()
#     active_prev = session.exec(
#         select(func.count()).select_from(User).where(
#             (User.last_active_at >= prev_start) & (User.last_active_at < prev_end)
#         )
#     ).one()
#     active_this_month_delta_pct = _pct_delta(active_curr, active_prev)
#
#     # Delta 2: emails this week vs previous week
#     week_start = now - timedelta(days=7)
#     prev_week_start = now - timedelta(days=14)
#     prev_week_end = week_start
#
#     emails_curr_week = session.exec(
#         select(func.count()).select_from(Email).where(Email.created_at >= week_start)
#     ).one()
#     emails_prev_week = session.exec(
#         select(func.count()).select_from(Email).where(
#             (Email.created_at >= prev_week_start) & (Email.created_at < prev_week_end)
#         )
#     ).one()
#     emails_this_week_delta_pct = _pct_delta(emails_curr_week, emails_prev_week)
#
#     return {
#         "total_users": int(total_users),
#         "total_emails": int(total_emails),
#         "active_now": int(active_now),
#         "active_this_month_delta_pct": float(active_this_month_delta_pct),
#         "emails_this_week_delta_pct": float(emails_this_week_delta_pct),
#     }


def _query_count(
        table: Any,
        index_name: str,
        pk_value: str,
        start_time: str,
        end_time: Optional[str] = None
) -> int:
    key_condition = boto3.dynamodb.conditions.Key("gsi_pk").eq(pk_value)

    if end_time:
        key_condition = key_condition & boto3.dynamodb.conditions.Key(
            "last_active_at"
        ).between(start_time, end_time)
    else:
        key_condition = key_condition & boto3.dynamodb.conditions.Key(
            "last_active_at"
        ).gte(start_time)

    try:
        response = table.query(
            IndexName=index_name,
            KeyConditionExpression=key_condition,
            Select="COUNT"
        )
        return response.get("Count", 0)
    except Exception as e:
        print(f"QueryCountError: {e}")
        return 0


@router.get("", response_model=Metrics)
def get_metrics(
        ledger_table=Depends(lambda: get_table("LEDGER_TABLE")),
        users_table=Depends(lambda: get_table("USERS_TABLE"))
):
    try:
        total_users = users_table.scan(Select="COUNT").get("Count", 0)
        total_emails = ledger_table.scan(
            FilterExpression=Attr("receivedAt").exists(),
            Select="COUNT"
        ).get("Count", 0)
    except Exception as e:
        print(f"TotalCountError: {e}")
        raise HTTPException(status_code=500, detail="Failed to count totals")

    now = datetime.now(timezone.utc)

    active_window_start = (now - timedelta(minutes=30)).isoformat()
    active_now = _query_count(
        users_table,
        "by-activity-gsi",
        "USERS",
        active_window_start
    )

    # Active users this month vs previous month
    curr_start = (now - timedelta(days=30)).isoformat()
    prev_start = (now - timedelta(days=60)).isoformat()

    active_curr = _query_count(
        users_table, "by-activity-gsi", "USERS", curr_start
    )
    active_prev = _query_count(
        users_table, "by-activity-gsi", "USERS", prev_start, curr_start
    )
    active_this_month_delta_pct = _pct_delta(active_curr, active_prev)

    # week_start = (now - timedelta(days=7)).isoformat()
    # prev_week_start = (now - timedelta(days=14)).isoformat()
    # emails_curr_week = _query_count_emails(ledger_table, week_start)
    # emails_prev_week = _query_count_emails(ledger_table, prev_week_start, week_start)
    # emails_this_week_delta_pct = _pct_delta(emails_curr_week, emails_prev_week)

    # Stubbed values since LEDGER_TABLE has no GSI
    emails_this_week_delta_pct = 0.0

    return {
        "total_users": total_users,
        "total_emails": total_emails,
        "active_now": active_now,
        "active_this_month_delta_pct": active_this_month_delta_pct,
        "emails_this_week_delta_pct": emails_this_week_delta_pct,
    }