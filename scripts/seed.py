import os
import random
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from services_common.aws_helper import get_s3, get_ddb
# from sqlmodel import Session
# from .database import engine, init_db
# from .models import User, Email

try:
    USERS_TABLE_NAME = "cloud-email-analyzer-dev-user"
    EMAIL_BUCKET_NAME = "cloud-email-analyzer-dev-ledger"
    EMAIL_GSI_PK_VALUE = "USERS"
    USER_ACTIVITY_GSI = "by-activity-gsi"
except KeyError as e:
    raise RuntimeError(f"Missing required environment variable: {e}")

# def seed():
#     init_db()
#     with Session(engine) as session:
#         users = []
#         for i in range(1, 51):
#             u = User(email=f"john{i:03d}.doe@gmail.com", is_active=bool(i % 3))
#             u.last_active_at = datetime.utcnow() - timedelta(minutes=random.randint(0,120))
#             session.add(u)
#             users.append(u)
#         session.commit()
#
#         categories = ["Spam", "Ham", "Promotional"]
#         verdicts = ["Safe", "Unsafe", "Suspicious"]
#
#         eid = 100000
#         for i in range(1, 64):
#             sender = f"john.da{i%10}@gmail.com"
#             recipient = f"john.ja{i%10}@gmail.com"
#             subject = "PlaceHolder Subject"
#             category = random.choices(categories, weights=[2,6,2])[0]
#             verdict = (
#                 "Safe" if category in ["Ham","Promotional"] and random.random() > 0.2
#                 else random.choice(verdicts)
#             )
#             e = Email(
#                 email_id=eid+i,
#                 sender=sender,
#                 recipient=recipient,
#                 subject=subject,
#                 category=category,
#                 verdict=verdict,
#             )
#             e.created_at = datetime.utcnow() - timedelta(days=random.randint(0,20), minutes=random.randint(0,1440))
#             session.add(e)
#         session.commit()
#     print("Seeded demo data.")
#
#

def seed_users():
    print(f"Seeding users into '{USERS_TABLE_NAME}'...")
    table = get_ddb().Table(USERS_TABLE_NAME)

    with table.batch_writer() as batch:
        for i in range(1, 51):
            now = datetime.now(timezone.utc)
            last_active = now - timedelta(minutes=random.randint(0, 120))

            item = {
                "userId": f"user-{i:03d}",
                "email": f"john{i:03d}.doe@gmail.com",
                "is_active": bool(i % 3),
                "last_active_at": last_active.isoformat(),
                "created_at": now.isoformat(),
                "gsi_pk": EMAIL_GSI_PK_VALUE,  # For the 'by-activity-gsi'
            }
            batch.put_item(Item=item)
    print(f"Successfully seeded 50 users.")


def seed_emails():
    print(f"Seeding emails into S3 bucket '{EMAIL_BUCKET_NAME}'...")
    s3 = get_s3()

    categories = ["Spam", "Ham", "Promotional"]
    senders = [
        "support@company-a.com",
        "billing@company-b.com",
        "newsletter@company-c.com",
        "prince.nigeria@scam.com",
        "jane.doe@personal.com"
    ]

    for i in range(1, 21):
        msg_id = f"seed-{i:03d}-{random.randint(10000, 99999)}"
        s3_key = f"raw/{msg_id}.eml"

        msg = EmailMessage()
        sender = random.choice(senders)
        msg["Subject"] = f"Seed Subject Line #{i}"
        msg["From"] = f"{sender.split('@')[0]} <{sender}>"
        msg["To"] = "test-recipient@my-domain.com"
        msg.set_content(
            f"This is the plain text body for seed email {i}.\n"
            f"Category is probably {random.choice(categories)}."
        )

        try:
            s3.put_object(
                Bucket=EMAIL_BUCKET_NAME,
                Key=s3_key,
                Body=str(msg).encode('utf-8')
            )
            print(f"  > Uploaded {s3_key}")
        except Exception as e:
            print(f"  > FAILED to upload {s3_key}: {e}")

    print(f"Successfully uploaded 20 email files to S3.")


if __name__ == "__main__":
    seed_users()
    seed_emails()
    print("\nSeed data generation complete.")
    print("Check your S3 bucket and DynamoDB tables in a few moments.")