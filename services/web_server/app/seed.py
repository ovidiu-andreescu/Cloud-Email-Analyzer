import random
from datetime import datetime, timedelta
from sqlmodel import Session
from .database import engine, init_db
from .models import User, Email

def seed():
    init_db()
    with Session(engine) as session:
        users = []
        for i in range(1, 51):
            u = User(email=f"john{i:03d}.doe@gmail.com", is_active=bool(i % 3))
            u.last_active_at = datetime.utcnow() - timedelta(minutes=random.randint(0,120))
            session.add(u)
            users.append(u)
        session.commit()

        categories = ["Spam", "Ham", "Promotional"]
        verdicts = ["Safe", "Unsafe", "Suspicious"]

        eid = 100000
        for i in range(1, 64):
            sender = f"john.da{i%10}@gmail.com"
            recipient = f"john.ja{i%10}@gmail.com"
            subject = "PlaceHolder Subject"
            category = random.choices(categories, weights=[2,6,2])[0]
            verdict = (
                "Safe" if category in ["Ham","Promotional"] and random.random() > 0.2
                else random.choice(verdicts)
            )
            e = Email(
                email_id=eid+i,
                sender=sender,
                recipient=recipient,
                subject=subject,
                category=category,
                verdict=verdict,
            )
            e.created_at = datetime.utcnow() - timedelta(days=random.randint(0,20), minutes=random.randint(0,1440))
            session.add(e)
        session.commit()
    print("Seeded demo data.")

if __name__ == "__main__":
    seed()
