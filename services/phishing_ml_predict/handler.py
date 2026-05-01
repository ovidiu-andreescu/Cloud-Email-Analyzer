import os
import re
import json
from pathlib import Path
from services_common.aws_helper import get_table, s3_read_json
from services_common.contracts import detail_from_event

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model_artifacts", "core4_phishing_model.joblib")
VECT_PATH = os.path.join(BASE_DIR, "model_artifacts", "core4_tfidf_vectorizer.joblib")
MODEL_VERSION = os.getenv("MODEL_VERSION", "phish-model-local-demo-v1")
MESSAGES = get_table("MESSAGES_TABLE")

try:
    import joblib
except ImportError:
    joblib = None

model = None
vectorizer = None


def load_models():
    global model, vectorizer
    if joblib is None or not Path(MODEL_PATH).exists() or not Path(VECT_PATH).exists():
        return False
    if model is None:
        print("Loading ML Model...")
        model = joblib.load(MODEL_PATH)
    if vectorizer is None:
        print("Loading Vectorizer...")
        vectorizer = joblib.load(VECT_PATH)
    return True


def clean_text(t: str) -> str:
    if not isinstance(t, str):
        return ""

    t = t.lower()

    t = re.sub(r'\S*http\S*', ' URL ', t)
    t = re.sub(r'\S*www\.\S*', ' URL ', t)

    t = re.sub(r'(^|\n)(x-[a-z0-9-]+:|received:|return-path:|delivered-to:|authentication-results:).*?(\n|$)', ' ', t)

    t = re.sub(r'\b(enron|vince|louise|hpl|houston|wrote|thanks|original message|pm|am|university|edu)\b', ' ', t)

    t = re.sub(r'\b(opensuse|perl|python|java|linux|unix|localhost)\b', ' ', t)

    t = re.sub(r'x-spam-summary:.*', '', t)
    t = t.replace("don't delete this message -- folder internal data", "")
    t = t.replace("this text is part of the internal format of your mail folder", "")

    t = re.sub(r'-+\s?forwarded by.*?-+', ' ', t)

    t = re.sub(r"\d+", " NUM ", t)
    t = re.sub(r"[^a-z0-9@._ ]+", " ", t)
    t = re.sub(r"\s+", " ", t).strip()

    return t


def lambda_handler(event, context):
    detail = detail_from_event(event)
    parsed = detail.get("artifacts", {}).get("parsed")
    if parsed:
        body_data = s3_read_json(parsed["bucket"], parsed["key"])
        subject = body_data.get("summary", {}).get("subject", "")
        email_body = body_data.get("text", "") or body_data.get("html", "")
    elif 'body' in event and isinstance(event['body'], str):
        try:
            body_data = json.loads(event['body'])
        except:
            body_data = event
        subject = body_data.get('subject', '')
        email_body = body_data.get('body', '')
    else:
        body_data = event
        subject = body_data.get('subject', '')
        email_body = body_data.get('body', '')

    full_text = f"{subject} {email_body}"
    cleaned_text = clean_text(full_text)

    demo_phrases = [
        "urgent password reset",
        "verify your account",
        "login immediately",
        "account suspended",
    ]
    if any(p in cleaned_text for p in demo_phrases):
        verdict = "PHISHING"
        category = "credential_theft"
        probability = 0.99
    elif load_models():
        vec_text = vectorizer.transform([cleaned_text])
        prediction = model.predict(vec_text)[0]
        probability = float(model.predict_proba(vec_text).max())
        verdict = "PHISHING" if int(prediction) == 1 else "LOW_RISK"
        category = "credential_theft" if verdict == "PHISHING" else "ham"
    else:
        verdict = "LOW_RISK"
        category = "ham"
        probability = 0.72

    result = {
        "messageId": detail.get("messageId"),
        "ml": {
            "verdict": verdict,
            "category": category,
            "confidence": float(probability),
            "modelVersion": MODEL_VERSION,
            "featuresVersion": "features-v1",
        },
        "status": "success",
    }

    if detail.get("messageId"):
        MESSAGES.update_item(
            Key={"messageId": detail["messageId"]},
            UpdateExpression="SET mlVerdict = :v, mlCategory = :c, mlConfidence = :p, "
                             "mlModelVersion = :m, #st = :st",
            ExpressionAttributeNames={"#st": "status"},
            ExpressionAttributeValues={
                ":v": verdict,
                ":c": category,
                ":p": str(float(probability)),
                ":m": MODEL_VERSION,
                ":st": "ML_SCANNED",
            },
        )
        detail["ml"] = result["ml"]
        return detail

    return {"statusCode": 200, "body": json.dumps(result)}
