import boto3, json

s3 = boto3.client('s3')

def s3_read(bucket, key):
    obj = s3.get_object(
        Bucket = bucket,
        Key = key
    )

    return obj["Body"].read()

def s3_write(bucket, key, data, metadata = None):
    s3.put_object(
        Bucket = bucket,
        Key = key,
        Body = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
        Metadata = metadata or {}
    )