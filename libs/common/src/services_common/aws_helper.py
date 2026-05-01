import boto3, json, os
from functools import lru_cache

def region() -> str:
    return (os.getenv("AWS_REGION")
            or os.getenv("AWS_DEFAULT_REGION")
            or "eu-central-1")

def _endpoint(service: str) -> str | None:
    return (
        os.getenv(f"AWS_{service.upper()}_ENDPOINT_URL")
        or os.getenv("AWS_ENDPOINT_URL")
    )

@lru_cache(maxsize=1)
def _session() -> boto3.session.Session:
    return boto3.session.Session(region_name = region())

@lru_cache(maxsize=None)
def get_s3():
    return _session().client("s3", endpoint_url = _endpoint("s3"))

@lru_cache(maxsize=None)
def get_ddb():
    return _session().resource("dynamodb", endpoint_url=_endpoint("dynamodb"))

def get_table(table_env_name: str):
    prefix = os.getenv("LOCAL_PREFIX", "cloud-email-analyzer-local-dev")
    defaults = {
        "MESSAGES_TABLE": os.getenv("LEDGER_TABLE", f"{prefix}-messages"),
        "LEDGER_TABLE": os.getenv("MESSAGES_TABLE", f"{prefix}-messages"),
        "USERS_TABLE": f"{prefix}-users",
        "MAILBOXES_TABLE": f"{prefix}-mailboxes",
        "INBOX_TABLE": f"{prefix}-inbox-messages",
        "ATTACHMENTS_TABLE": f"{prefix}-attachments",
        "AUDIT_TABLE": f"{prefix}-audit-log",
    }
    table_name = os.environ.get(table_env_name, defaults.get(table_env_name))
    if not table_name:
        raise KeyError(table_env_name)
    return get_ddb().Table(table_name)

def s3_read(bucket, key):
    s3 = get_s3()
    if not s3:
        raise Exception("S3 client not initialized.")
    obj = s3.get_object(
        Bucket = bucket,
        Key = key
    )
    return obj["Body"].read()

def s3_write(bucket, key, data, metadata = None):
    s3 = get_s3()
    if not s3:
        raise Exception("S3 client not initialized.")
    s3.put_object(
        Bucket = bucket,
        Key = key,
        Body = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
        ContentType = "application/json",
        Metadata = metadata or {}
    )

def s3_write_bytes(bucket, key, data, content_type=None, metadata=None):
    s3 = get_s3()
    if not s3:
        raise Exception("S3 client not initialized.")
    s3.put_object(
        Bucket = bucket,
        Key = key,
        Body = data,
        ContentType = content_type or "application/octet-stream",
        Metadata = metadata or {}
    )

def s3_read_json(bucket, key):
    return json.loads(s3_read(bucket, key).decode("utf-8"))

def eventbridge_client():
    return _session().client("events", endpoint_url=_endpoint("events"))

def stepfunctions_client():
    return _session().client("stepfunctions", endpoint_url=_endpoint("stepfunctions"))
