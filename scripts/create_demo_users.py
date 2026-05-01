#!/usr/bin/env python3
import json
import os
import subprocess


REGION = os.getenv("AWS_DEFAULT_REGION", "eu-central-1")
ENDPOINT = os.getenv("AWS_ENDPOINT_URL", os.getenv("LOCALSTACK_ENDPOINT", "http://localhost:4566"))
PREFIX = os.getenv("LOCAL_PREFIX", "cloud-email-analyzer-local-dev")


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


def main():
    users = os.getenv("USERS_TABLE", f"{PREFIX}-users")
    mailboxes = os.getenv("MAILBOXES_TABLE", f"{PREFIX}-mailboxes")

    demo_users = [
        {"userId": "USER#admin", "email": "admin@demo.local", "displayName": "Security Admin", "role": "admin", "tenantId": "demo", "status": "ACTIVE"},
        {"userId": "USER#alice", "email": "alice@demo.local", "displayName": "Alice", "role": "user", "tenantId": "demo", "status": "ACTIVE"},
        {"userId": "USER#bob", "email": "bob@demo.local", "displayName": "Bob", "role": "user", "tenantId": "demo", "status": "ACTIVE"},
    ]
    for user in demo_users:
        put_item(users, user)

    mailbox_rows = [
        {"emailAddress": "alice@demo.local", "tenantId": "demo", "ownerUserIds": ["USER#alice"], "mailboxType": "PERSONAL"},
        {"emailAddress": "bob@demo.local", "tenantId": "demo", "ownerUserIds": ["USER#bob"], "mailboxType": "PERSONAL"},
        {"emailAddress": "security@demo.local", "tenantId": "demo", "ownerUserIds": ["USER#admin"], "mailboxType": "QUARANTINE"},
        {"emailAddress": "quarantine@demo.local", "tenantId": "demo", "ownerUserIds": ["USER#admin"], "mailboxType": "QUARANTINE"},
    ]
    for mailbox in mailbox_rows:
        put_item(mailboxes, mailbox)

    print("Created demo users and mailbox mappings:")
    for user in demo_users:
        print(f"  {user['email']} / {user['role']}")


if __name__ == "__main__":
    main()
