#!/usr/bin/env python3
import json
import os
import subprocess
import time


REGION = os.getenv("AWS_DEFAULT_REGION", os.getenv("AWS_REGION", "eu-central-1"))
ENDPOINT = os.getenv("AWS_ENDPOINT_URL", os.getenv("LOCALSTACK_ENDPOINT", "http://localhost:4566"))
PREFIX = os.getenv("LOCAL_PREFIX", "cloud-email-analyzer-local-dev")


def aws(*args, check=True):
    env = {
        **os.environ,
        "AWS_ACCESS_KEY_ID": "test",
        "AWS_SECRET_ACCESS_KEY": "test",
        "AWS_DEFAULT_REGION": REGION,
    }
    cmd = ["aws", f"--endpoint-url={ENDPOINT}", *args, "--region", REGION, "--output", "json"]
    result = subprocess.run(cmd, env=env, text=True, capture_output=True)
    if check and result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    if not result.stdout.strip():
        return {}
    return json.loads(result.stdout)


def table_exists(name):
    result = aws("dynamodb", "describe-table", "--table-name", name, check=False)
    return "Table" in result


def wait_active(name):
    for _ in range(30):
        result = aws("dynamodb", "describe-table", "--table-name", name)
        if result.get("Table", {}).get("TableStatus") == "ACTIVE":
            return
        time.sleep(1)
    raise TimeoutError(f"{name} did not become ACTIVE")


def create_table(config):
    name = config["TableName"]
    if table_exists(name):
        print(f"[local-tables] exists {name}")
        return
    aws("dynamodb", "create-table", "--cli-input-json", json.dumps(config))
    wait_active(name)
    print(f"[local-tables] created {name}")


def main():
    create_table({
        "TableName": f"{PREFIX}-messages",
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [{"AttributeName": "messageId", "AttributeType": "S"}],
        "KeySchema": [{"AttributeName": "messageId", "KeyType": "HASH"}],
    })
    create_table({
        "TableName": f"{PREFIX}-users",
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
            {"AttributeName": "userId", "AttributeType": "S"},
            {"AttributeName": "gsi_pk", "AttributeType": "S"},
            {"AttributeName": "last_active_at", "AttributeType": "S"},
        ],
        "KeySchema": [{"AttributeName": "userId", "KeyType": "HASH"}],
        "GlobalSecondaryIndexes": [{
            "IndexName": "by-activity-gsi",
            "KeySchema": [
                {"AttributeName": "gsi_pk", "KeyType": "HASH"},
                {"AttributeName": "last_active_at", "KeyType": "RANGE"},
            ],
            "Projection": {"ProjectionType": "ALL"},
        }],
    })
    create_table({
        "TableName": f"{PREFIX}-mailboxes",
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [{"AttributeName": "emailAddress", "AttributeType": "S"}],
        "KeySchema": [{"AttributeName": "emailAddress", "KeyType": "HASH"}],
    })
    create_table({
        "TableName": f"{PREFIX}-inbox-messages",
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
            {"AttributeName": "userId", "AttributeType": "S"},
            {"AttributeName": "sortKey", "AttributeType": "S"},
        ],
        "KeySchema": [
            {"AttributeName": "userId", "KeyType": "HASH"},
            {"AttributeName": "sortKey", "KeyType": "RANGE"},
        ],
    })
    create_table({
        "TableName": f"{PREFIX}-attachments",
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
            {"AttributeName": "messageId", "AttributeType": "S"},
            {"AttributeName": "attachmentId", "AttributeType": "S"},
        ],
        "KeySchema": [
            {"AttributeName": "messageId", "KeyType": "HASH"},
            {"AttributeName": "attachmentId", "KeyType": "RANGE"},
        ],
    })
    create_table({
        "TableName": f"{PREFIX}-audit-log",
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
            {"AttributeName": "tenantId", "AttributeType": "S"},
            {"AttributeName": "sortKey", "AttributeType": "S"},
        ],
        "KeySchema": [
            {"AttributeName": "tenantId", "KeyType": "HASH"},
            {"AttributeName": "sortKey", "KeyType": "RANGE"},
        ],
    })


if __name__ == "__main__":
    main()
