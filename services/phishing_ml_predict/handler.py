import os
import re
import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from services_common.aws_helper import get_table, s3_read_json
from services_common.contracts import detail_from_event

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model_artifacts" / "core4_phishing_model.joblib"
VECT_PATH = BASE_DIR / "model_artifacts" / "core4_tfidf_vectorizer.joblib"
DEMO_FALLBACK_ENABLED = os.getenv("PHISHING_ML_ENABLE_DEMO_FALLBACK", "").lower() in {
    "1",
    "true",
    "yes",
    "on",
}
MESSAGES = get_table("MESSAGES_TABLE")

try:
    import joblib
except ImportError:
    joblib = None

model = None
vectorizer = None
model_load_error = None


def _artifact_fingerprint() -> str:
    digest = hashlib.sha256()
    for path in (MODEL_PATH, VECT_PATH):
        digest.update(path.name.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()[:12]


def _model_version() -> str:
    configured = os.getenv("MODEL_VERSION")
    if configured:
        return configured
    if MODEL_PATH.exists() and VECT_PATH.exists():
        return f"core4-joblib-{_artifact_fingerprint()}"
    return "demo-fallback-unversioned"


MODEL_VERSION = _model_version()


def load_models():
    global model, vectorizer, model_load_error
    if joblib is None:
        model_load_error = "joblib_not_installed"
        return False
    missing = [str(path) for path in (MODEL_PATH, VECT_PATH) if not path.exists()]
    if missing:
        model_load_error = f"missing_artifacts:{','.join(missing)}"
        return False
    try:
        if model is None:
            print(f"Loading ML model from {MODEL_PATH}")
            model = joblib.load(MODEL_PATH)
        if vectorizer is None:
            print(f"Loading TF-IDF vectorizer from {VECT_PATH}")
            vectorizer = joblib.load(VECT_PATH)
    except Exception as exc:
        model = None
        vectorizer = None
        model_load_error = f"{type(exc).__name__}: {exc}"
        print(f"Unable to load packaged phishing ML artifacts: {model_load_error}")
        return False
    model_load_error = None
    return True


def predict_with_model(cleaned_text: str):
    vec_text = vectorizer.transform([cleaned_text])
    prediction = model.predict(vec_text)[0]
    if hasattr(model, "predict_proba"):
        probability = float(model.predict_proba(vec_text).max())
    elif hasattr(model, "decision_function"):
        score = float(model.decision_function(vec_text)[0])
        probability = 1.0 / (1.0 + pow(2.718281828459045, -score))
    else:
        probability = 1.0
    verdict = "PHISHING" if int(prediction) == 1 else "LOW_RISK"
    category = "credential_theft" if verdict == "PHISHING" else "ham"
    return verdict, category, probability


def predict_with_demo_fallback(cleaned_text: str):
    demo_phrases = [
        "urgent password reset",
        "verify your account",
        "login immediately",
        "account suspended",
    ]
    matched_phrase = next((p for p in demo_phrases if p in cleaned_text), None)
    if matched_phrase:
        return "PHISHING", "credential_theft", 0.99, matched_phrase
    return "LOW_RISK", "ham", 0.50, None


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

    fallback_reason = None
    demo_match = None
    if load_models():
        verdict, category, probability = predict_with_model(cleaned_text)
        model_source = "packaged_joblib"
    elif DEMO_FALLBACK_ENABLED:
        verdict, category, probability, demo_match = predict_with_demo_fallback(cleaned_text)
        model_source = "demo_fallback"
        fallback_reason = model_load_error or "demo_fallback_enabled"
    else:
        verdict = "ERROR"
        category = "model_unavailable"
        probability = 0.0
        model_source = "unavailable"
        fallback_reason = model_load_error or "model_unavailable"

    result = {
        "messageId": detail.get("messageId"),
        "ml": {
            "verdict": verdict,
            "category": category,
            "confidence": float(probability),
            "modelVersion": MODEL_VERSION,
            "modelSource": model_source,
            "featuresVersion": "features-v1",
        },
        "status": "success",
    }
    if fallback_reason:
        result["ml"]["fallbackReason"] = fallback_reason
    if demo_match:
        result["ml"]["demoMatchedPhrase"] = demo_match

    if detail.get("messageId"):
        now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        MESSAGES.update_item(
            Key={"messageId": detail["messageId"]},
            UpdateExpression="SET mlVerdict = :v, mlCategory = :c, mlConfidence = :p, "
                             "mlModelVersion = :m, mlModelSource = :src, mlScannedAt = :now, #st = :st",
            ExpressionAttributeNames={"#st": "status"},
            ExpressionAttributeValues={
                ":v": verdict,
                ":c": category,
                ":p": str(float(probability)),
                ":m": MODEL_VERSION,
                ":src": model_source,
                ":now": now,
                ":st": "ML_SCANNED",
            },
        )
        detail["ml"] = result["ml"]
        return detail

    return {"statusCode": 200, "body": json.dumps(result)}
