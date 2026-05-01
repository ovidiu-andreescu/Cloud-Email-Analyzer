from posixpath import join
import time
import boto3
import botocore
import glob
import hashlib
import json
import logging
import os
import pwd
import subprocess
import shutil
from datetime import datetime, timezone
from urllib.parse import unquote_plus
from services_common.aws_helper import get_s3, get_table
from services_common.contracts import detail_from_event

try:
    from aws_lambda_powertools import Logger, Metrics
except ImportError:
    class Logger:
        def info(self, message):
            print(message)

        def error(self, message):
            print(message)

        def debug(self, message):
            print(message)

        def inject_lambda_context(self, log_event=False):
            def decorator(func):
                return func
            return decorator

    class Metrics:
        def __init__(self, *args, **kwargs):
            pass

        def log_metrics(self, capture_cold_start_metric=True):
            def decorator(func):
                return func
            return decorator

        def add_metric(self, name, unit, value):
            return None

logger = Logger()
metrics = Metrics(namespace=os.getenv("POWERTOOLS_METRICS_NAMESPACE", "CloudEmailAnalyzer"), service="attachment-scan")

s3_resource = boto3.resource("s3")
s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

INPROGRESS = "IN PROGRESS"
CLEAN = "CLEAN"
INFECTED = "INFECTED"
ERROR = "ERROR"
SKIP = "N/A"

MAX_BYTES = 4000000000
EICAR_MARKER = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR"


class ClamAVException(Exception):
    """Raise when ClamAV returns an unexpected exit code"""

    def __init__(self, message):
        self.message = message

    def __str__(self):
        return str(self.message)


class ArchiveException(Exception):
    """Raise when 7za exits with an unexpected code"""

    def __init__(self, message):
        self.message = message

    def __str__(self):
        return str(self.message)


class FileTooBigException(Exception):
    """Raise when file(s) is/are too large for ClamAV to scan"""

    def __init__(self, message):
        self.message = message

    def __str__(self):
        return str(self.message)

def update_ledger(message_id, scan_status):
    verdict_map = {
        "CLEAN": "Safe",
        "INFECTED": "Unsafe",
        "ERROR": "Suspicious",
    }
    virus_status = verdict_map.get(scan_status, "Suspicious")

    try:
        table_name = os.environ.get("LEDGER_TABLE")
        if not table_name:
            logger.error("LEDGER_TABLE env var missing")
            return

        table = dynamodb.Table(table_name)
        table.update_item(
            Key={"messageId": message_id},
            UpdateExpression="SET virus_verdict = :v",
            ExpressionAttributeValues={":v": virus_status}
        )
        logger.info(f"Updated ledger for {message_id}: {virus_status}")
    except Exception as e:
        logger.error(f"Failed to update ledger: {e}")

def get_message_id(key):
    parts = key.split("/")
    if len(parts) > 1:
        return parts[1]
    return key

def get_event_params(event):
    if "detail" in event and "bucket" in event["detail"]:
        bucket = event["detail"]["bucket"]["name"]
        key = unquote_plus(event["detail"]["object"]["key"])
        size = event["detail"]["object"].get("size", 0)
        return bucket, key, size

    if "Records" in event and "s3" in event["Records"][0]:
        s3_data = event["Records"][0]["s3"]
        bucket = s3_data["bucket"]["name"]
        key = unquote_plus(s3_data["object"]["key"])
        size = s3_data["object"].get("size", 0)
        return bucket, key, size

    raise KeyError("Event structure not recognized (Missing 'Records' or 'detail')")


def _scan_payload(path, payload):
    database_dir = os.getenv("CLAMAV_DB_DIR", "/var/lib/clamav")
    try:
        result = subprocess.run(
            ["clamscan", "--stdout", f"--database={database_dir}", path],
            stderr=subprocess.STDOUT,
            stdout=subprocess.PIPE,
            timeout=int(os.getenv("CLAMAV_TIMEOUT_SECONDS", "30")),
        )
        output = result.stdout.decode("utf-8", "replace")
        if result.returncode == 0:
            return "SAFE", ""
        if result.returncode == 1:
            return "UNSAFE", _extract_clamav_signature(output)
        return "SCAN_ERROR", output[-500:]
    except FileNotFoundError:
        if os.getenv("CLAMAV_EICAR_FALLBACK", "false").lower() == "true" and EICAR_MARKER in payload:
            return "UNSAFE", "Eicar-Test-Signature"
        return "SCAN_ERROR", "clamscan-not-installed"
    except subprocess.TimeoutExpired:
        return "TIMEOUT", "clamscan-timeout"


def _extract_clamav_signature(output):
    for line in reversed(output.splitlines()):
        if " FOUND" not in line:
            continue
        signature = line.rsplit(":", 1)[-1].replace("FOUND", "").strip()
        return signature or line[-500:]
    return output[-500:]


def _handle_attachment_contract(event):
    detail = detail_from_event(event)
    attachments = detail.get("artifacts", {}).get("attachments", [])
    message_id = detail["messageId"]
    table = get_table("ATTACHMENTS_TABLE")
    messages = get_table("MESSAGES_TABLE")
    s3 = get_s3()
    results = []
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    for att in attachments:
        payload = s3.get_object(Bucket=att["s3Bucket"], Key=att["s3Key"])["Body"].read()
        sha256 = hashlib.sha256(payload).hexdigest()
        path = f"/tmp/{att['attachmentId']}"
        with open(path, "wb") as f:
            f.write(payload)
        verdict, signature = _scan_payload(path, payload)
        try:
            os.remove(path)
        except OSError:
            pass

        status = "SCANNED" if verdict in {"SAFE", "UNSAFE"} else verdict
        table.update_item(
            Key={"messageId": message_id, "attachmentId": att["attachmentId"]},
            UpdateExpression="SET sha256 = :sha, scanStatus = :ss, scanVerdict = :sv, clamavSignature = :sig, scannedAt = :now",
            ExpressionAttributeValues={
                ":sha": sha256,
                ":ss": status,
                ":sv": verdict,
                ":sig": signature,
                ":now": now,
            },
        )
        results.append({**att, "sha256": sha256, "scanStatus": status, "scanVerdict": verdict})

    messages.update_item(
        Key={"messageId": message_id},
        UpdateExpression="SET #st = :st, attachmentsScannedAt = :now",
        ExpressionAttributeNames={"#st": "status"},
        ExpressionAttributeValues={":st": "ATTACHMENTS_SCANNED", ":now": now},
    )
    detail["attachmentResults"] = results
    return detail


@metrics.log_metrics(capture_cold_start_metric=True)
@logger.inject_lambda_context(log_event=True)
def lambda_handler(event, context):
    logger.info(json.dumps(event))

    if "artifacts" in event or ("detail" in event and "artifacts" in event.get("detail", {})):
        return _handle_attachment_contract(event)

    try:
        input_bucket, input_key, input_size = get_event_params(event)
    except KeyError as e:
        logger.error(f"Failed to parse event: {str(e)}")
        return {
            "source": "serverless-clamscan",
            "status": ERROR,
            "message": f"Failed to parse event structure: {str(e)}"
        }

    summary = ""
    if not input_key.endswith("/"):
        mount_path = os.environ["EFS_MOUNT_PATH"]
        definitions_path = f"{mount_path}/{os.environ['EFS_DEF_PATH']}"
        payload_path = f"{mount_path}/{context.aws_request_id}"
        tmp_path = f"{payload_path}-tmp"

        set_status(input_bucket, input_key, INPROGRESS)
        create_dir(input_bucket, input_key, payload_path)
        create_dir(input_bucket, input_key, tmp_path)
        download_object(input_bucket, input_key, payload_path)

        expand_if_large_archive(
            input_bucket,
            input_key,
            payload_path,
            input_size,
        )

        create_dir(input_bucket, input_key, definitions_path)
        summary = scan(
            input_bucket, input_key, payload_path, definitions_path, tmp_path
        )

        message_id = get_message_id(input_key)
        update_ledger(message_id, summary["status"])

        delete(payload_path)
        delete(tmp_path)
    else:
        summary = {
            "source": "serverless-clamscan",
            "input_bucket": input_bucket,
            "input_key": input_key,
            "status": SKIP,
            "message": "S3 Event trigger was for a non-file object",
        }
    logger.info(summary)
    return summary

def set_status(bucket, key, status):
    """Set the scan-status tag of the S3 Object"""
    old_tags = {}
    try:
        response = s3_client.get_object_tagging(Bucket=bucket, Key=key)
        old_tags = {i["Key"]: i["Value"] for i in response["TagSet"]}
    except botocore.exceptions.ClientError as e:
        logger.debug(e.response["Error"]["Message"])
    new_tags = {"scan-status": status}
    tags = {**old_tags, **new_tags}
    s3_client.put_object_tagging(
        Bucket=bucket,
        Key=key,
        Tagging={
            "TagSet": [
                {"Key": str(k), "Value": str(v)} for k, v in tags.items()
            ]
        },
    )
    metrics.add_metric(name=status, unit="Count", value=1)


def create_dir(input_bucket, input_key, download_path):
    """Creates a directory at the specified location
    if it does not already exists"""
    sub_dir = os.path.dirname(input_key)
    full_path = download_path
    if len(sub_dir) > 0:
        full_path = os.path.join(full_path, sub_dir)
    if not os.path.exists(full_path):
        try:
            os.makedirs(full_path, exist_ok=True)
        except OSError as e:
            report_failure(input_bucket, input_key, download_path, str(e))


def download_object(input_bucket, input_key, download_path):
    """Downloads the specified file from S3 to EFS"""
    try:
        s3_resource.Bucket(input_bucket).download_file(
            input_key, f"{download_path}/{input_key}"
        )
        logger.info("FILES DOWNLOADED")
    except botocore.exceptions.ClientError as e:
        report_failure(
            input_bucket,
            input_key,
            download_path,
            e.response["Error"]["Message"],
        )


def expand_if_large_archive(input_bucket, input_key, download_path, byte_size):
    """Expand the file if it is an archival type and larger than ClamAV Max Size"""
    if byte_size > MAX_BYTES:
        file_name = f"{download_path}/{input_key}"
        try:
            command = ["7za", "x", "-y", f"{file_name}", f"-o{download_path}"]
            archive_summary = subprocess.run(
                command,
                stderr=subprocess.STDOUT,
                stdout=subprocess.PIPE,
            )
            if archive_summary.returncode not in [0, 1]:
                raise ArchiveException(
                    f"7za exited with unexpected code: {archive_summary.returncode}."
                )
            delete(download_path, input_key)
            large_file_list = []
            for root, dirs, files in os.walk(download_path, topdown=False):
                for name in files:
                    size = os.path.getsize(os.path.join(root, name))
                    if size > MAX_BYTES:
                        large_file_list.append(name)
            if large_file_list:
                raise FileTooBigException(
                    f"Archive {input_key} contains files {large_file_list} "
                    f"which are at greater than ClamAV max of {MAX_BYTES} bytes"
                )
        except subprocess.CalledProcessError as e:
            report_failure(
                input_bucket, input_key, download_path, str(e.stderr)
            )
        except ArchiveException as e:
            report_failure(input_bucket, input_key, download_path, e.message)
        except FileTooBigException as e:
            report_failure(input_bucket, input_key, download_path, e.message)
    else:
        return

def scan(input_bucket, input_key, download_path, definitions_path, tmp_path):
    """Scans the object from S3"""
    # Max file size support by ClamAV
    try:
        command = [
            "clamscan",
            "-v",
            "--stdout",
            f"--max-filesize={MAX_BYTES}",
            f"--max-scansize={MAX_BYTES}",
            f"--database={definitions_path}",
            "-r",
            f"--tempdir={tmp_path}",
            f"{download_path}",
        ]
        logger.info("INIT SCAN")
        scan_summary = subprocess.run(
            command,
            stderr=subprocess.STDOUT,
            stdout=subprocess.PIPE,
        )
        status = ""
        if scan_summary.returncode == 0:
            status = CLEAN
        elif scan_summary.returncode == 1:
            status = INFECTED
        else:
            raise ClamAVException(
                f"ClamAV exited with unexpected code: {scan_summary.returncode}."
                f"\nOutput: {scan_summary.stdout.decode('utf-8')}"
            )
        set_status(input_bucket, input_key, status)
        return {
            "source": "serverless-clamscan",
            "input_bucket": input_bucket,
            "input_key": input_key,
            "status": status,
            "message": scan_summary.stdout.decode("utf-8"),
        }
    except subprocess.CalledProcessError as e:
        report_failure(input_bucket, input_key, download_path, str(e.stderr))
    except FileNotFoundError:
        report_failure(input_bucket, input_key, download_path, "clamscan-not-installed")
    except ClamAVException as e:
        report_failure(input_bucket, input_key, download_path, e.message)


def delete(download_path, input_key=None):
    """Deletes the file/folder from the EFS File System"""
    if input_key:
        file = f"{download_path}/{input_key}"
        if os.path.exists(file):
            os.remove(file)
    else:
        for obj in glob.glob(os.path.join(download_path, "*")):
            if os.path.isdir(obj):
                shutil.rmtree(obj)
            else:
                os.remove(obj)


def report_failure(input_bucket, input_key, download_path, message):
    """Set the S3 object tag to ERROR if scan function fails"""
    set_status(input_bucket, input_key, ERROR)
    delete(download_path)
    exception_json = {
        "source": "serverless-clamscan",
        "input_bucket": input_bucket,
        "input_key": input_key,
        "status": ERROR,
        "message": message,
    }
    raise Exception(json.dumps(exception_json))
