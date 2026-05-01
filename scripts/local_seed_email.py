#!/usr/bin/env python3
import argparse
import json
import os
import subprocess
import tempfile
from pathlib import Path

from services_common.contracts import MAIL_DETAIL_TYPE, MAIL_SOURCE, make_mail_received_event, stable_message_id


REGION = os.getenv("AWS_DEFAULT_REGION", "eu-central-1")
ENDPOINT = os.getenv("AWS_ENDPOINT_URL", os.getenv("LOCALSTACK_ENDPOINT", "http://localhost:4566"))
PREFIX = os.getenv("LOCAL_PREFIX", "cloud-email-analyzer-local-dev")
RAW_BUCKET = os.getenv("RAW_BUCKET", f"{PREFIX}-inbound")
EVENT_BUS = os.getenv("EVENT_BUS_NAME", f"{PREFIX}-mail-events")


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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--to", required=True)
    parser.add_argument("--from-address", default=None)
    parser.add_argument("--message-id", default=None)
    parser.add_argument("--tenant-id", default="demo")
    args = parser.parse_args()

    path = Path(args.email)
    raw = path.read_bytes()
    message_id = args.message_id or stable_message_id(raw)
    raw_key = f"raw-emails/{message_id}.eml"
    manifest_key = f"manifests/{message_id}.json"
    recipients = [v.strip().lower() for v in args.to.split(",") if v.strip()]

    event = make_mail_received_event(
        raw_bytes=raw,
        raw_bucket=RAW_BUCKET,
        raw_key=raw_key,
        recipients=recipients,
        mail_from=args.from_address,
        tenant_id=args.tenant_id,
        message_id=message_id,
    )

    aws(
        "s3api", "put-object",
        "--bucket", RAW_BUCKET,
        "--key", raw_key,
        "--body", str(path),
        "--content-type", "message/rfc822",
    )
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as manifest:
        json.dump(event, manifest, indent=2)
        manifest_path = manifest.name
    try:
        aws(
            "s3api", "put-object",
            "--bucket", RAW_BUCKET,
            "--key", manifest_key,
            "--body", manifest_path,
            "--content-type", "application/json",
        )
    finally:
        Path(manifest_path).unlink(missing_ok=True)
    aws("events", "put-events", "--entries", json.dumps([{
        "Source": MAIL_SOURCE,
        "DetailType": MAIL_DETAIL_TYPE,
        "EventBusName": EVENT_BUS,
        "Detail": json.dumps(event["detail"]),
    }]))

    print(f"Seeded {path} as {message_id}")
    print(f"Raw: s3://{RAW_BUCKET}/{raw_key}")
    print("Dashboard: http://localhost:5173")


if __name__ == "__main__":
    main()
