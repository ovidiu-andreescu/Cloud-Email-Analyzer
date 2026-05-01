#!/usr/bin/env python3
import json
import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REGION = os.getenv("AWS_DEFAULT_REGION", os.getenv("AWS_REGION", "eu-central-1"))
ENDPOINT = os.getenv("AWS_ENDPOINT_URL", os.getenv("LOCALSTACK_ENDPOINT", "http://localhost:4566"))
PREFIX = os.getenv("LOCAL_PREFIX", "cloud-email-analyzer-local-dev")
ACCOUNT_ID = os.getenv("LOCALSTACK_ACCOUNT_ID", "000000000000")
BUS_NAME = os.getenv("EVENT_BUS_NAME", f"{PREFIX}-mail-events")
RULE_NAME = os.getenv("EVENT_RULE_NAME", f"{PREFIX}-mail-received")
STATE_MACHINE_NAME = f"{PREFIX}-email-pipeline"
STATE_MACHINE_ARN = f"arn:aws:states:{REGION}:{ACCOUNT_ID}:stateMachine:{STATE_MACHINE_NAME}"
SFN_ROLE_ARN = f"arn:aws:iam::{ACCOUNT_ID}:role/{PREFIX}-sfn-role"
EVENT_ROLE_ARN = f"arn:aws:iam::{ACCOUNT_ID}:role/cloud-email-analyzer-eventbridge-sfn-role"


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


def lambda_arn(name):
    return f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{PREFIX}-{name}"


def render_definition():
    template = (ROOT / "infra/terraform/email_pipeline.asl.json").read_text()
    replacements = {
        "${init_ledger_lambda_arn}": lambda_arn("init-ledger"),
        "${resolve_recipients_lambda_arn}": lambda_arn("resolve-recipients"),
        "${parse_email_lambda_arn}": lambda_arn("parse-email"),
        "${phishing_ml_lambda_arn}": lambda_arn("phishing-ml"),
        "${attachment_scan_lambda_arn}": lambda_arn("attachment-scan"),
        "${aggregate_verdicts_lambda_arn}": lambda_arn("aggregate-verdicts"),
    }
    for needle, value in replacements.items():
        template = template.replace(needle, value)
    return template


def state_machine_exists():
    result = aws("stepfunctions", "describe-state-machine", "--state-machine-arn", STATE_MACHINE_ARN, check=False)
    return "stateMachineArn" in result


def ensure_state_machine():
    definition = render_definition()
    if state_machine_exists():
        aws(
            "stepfunctions", "update-state-machine",
            "--state-machine-arn", STATE_MACHINE_ARN,
            "--definition", definition,
            "--role-arn", SFN_ROLE_ARN,
        )
        print(f"[local-pipeline] updated {STATE_MACHINE_NAME}")
    else:
        aws(
            "stepfunctions", "create-state-machine",
            "--name", STATE_MACHINE_NAME,
            "--definition", definition,
            "--role-arn", SFN_ROLE_ARN,
            "--type", "STANDARD",
        )
        print(f"[local-pipeline] created {STATE_MACHINE_NAME}")


def ensure_event_target():
    aws("events", "put-targets", "--event-bus-name", BUS_NAME, "--rule", RULE_NAME, "--targets", json.dumps([{
        "Id": "StartEmailPipelineSFN",
        "Arn": STATE_MACHINE_ARN,
        "RoleArn": EVENT_ROLE_ARN,
    }]))
    print(f"[local-pipeline] wired {BUS_NAME}/{RULE_NAME} -> {STATE_MACHINE_NAME}")


def main():
    ensure_state_machine()
    ensure_event_target()


if __name__ == "__main__":
    main()
