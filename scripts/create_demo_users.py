#!/usr/bin/env python3
import base64
import hashlib
import json
import os
import subprocess
from pathlib import Path


REGION = os.getenv("AWS_DEFAULT_REGION", "eu-central-1")
ENDPOINT = os.getenv("AWS_ENDPOINT_URL", os.getenv("LOCALSTACK_ENDPOINT", "http://localhost:4566"))
PREFIX = os.getenv("LOCAL_PREFIX", "cloud-email-analyzer-local-dev")
PASSWORD_ALGORITHM = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 200000
DEFAULT_POPULATION_FILE = Path(__file__).resolve().parents[1] / "fixtures" / "demo_population.json"


def aws(*args):
    env = {
        **os.environ,
        "AWS_ACCESS_KEY_ID": "test",
        "AWS_SECRET_ACCESS_KEY": "test",
        "AWS_DEFAULT_REGION": REGION,
    }
    cmd = ["aws", f"--endpoint-url={ENDPOINT}", *args, "--region", REGION, "--output", "json"]
    result = subprocess.run(cmd, env=env, text=True, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return json.loads(result.stdout or "{}")


def ddb_value(value):
    if isinstance(value, str):
        return {"S": value}
    if isinstance(value, list):
        return {"L": [ddb_value(v) for v in value]}
    if isinstance(value, bool):
        return {"BOOL": value}
    if isinstance(value, (int, float)):
        return {"N": str(value)}
    raise TypeError(f"Unsupported DynamoDB value: {value!r}")


def put_item(table, item):
    aws("dynamodb", "put-item", "--table-name", table, "--item", json.dumps({
        key: ddb_value(value) for key, value in item.items()
    }))


def password_hash(password, salt):
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    )
    return base64.b64encode(digest).decode("ascii")


def demo_user(user_id, email, display_name, role, password, salt):
    return {
        "userId": user_id,
        "email": email,
        "displayName": display_name,
        "role": role,
        "tenantId": "demo",
        "status": "ACTIVE",
        "passwordAlgorithm": PASSWORD_ALGORITHM,
        "passwordHash": password_hash(password, salt),
        "passwordIterations": PASSWORD_ITERATIONS,
        "passwordSalt": salt,
    }


def load_population():
    population_file = Path(os.getenv("DEMO_POPULATION_FILE", DEFAULT_POPULATION_FILE))
    return json.loads(population_file.read_text())


def main():
    users = os.getenv("USERS_TABLE", f"{PREFIX}-users")
    mailboxes = os.getenv("MAILBOXES_TABLE", f"{PREFIX}-mailboxes")
    population = load_population()

    demo_users = [
        demo_user(
            user["userId"],
            user["email"],
            user["displayName"],
            user["role"],
            user["password"],
            user["passwordSalt"],
        )
        for user in population["users"]
    ]
    for user in demo_users:
        put_item(users, user)

    mailbox_rows = population["mailboxes"]
    for mailbox in mailbox_rows:
        put_item(mailboxes, mailbox)

    print("Created demo users and mailbox mappings:")
    for user in demo_users:
        print(f"  {user['email']} / {user['role']}")


if __name__ == "__main__":
    main()
