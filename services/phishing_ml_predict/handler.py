import os
import re
import joblib
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model_artifacts", "core4_phishing_model.joblib")
VECT_PATH = os.path.join(BASE_DIR, "model_artifacts", "core4_tfidf_vectorizer.joblib")

model = None
vectorizer = None


def load_models():
    global model, vectorizer
    if model is None:
        print("Loading ML Model...")
        model = joblib.load(MODEL_PATH)
    if vectorizer is None:
        print("Loading Vectorizer...")
        vectorizer = joblib.load(VECT_PATH)


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
    load_models()

    if 'body' in event and isinstance(event['body'], str):
        try:
            body_data = json.loads(event['body'])
        except:
            body_data = event
    else:
        body_data = event

    subject = body_data.get('subject', '')
    email_body = body_data.get('body', '')

    full_text = f"{subject} {email_body}"
    cleaned_text = clean_text(full_text)

    vec_text = vectorizer.transform([cleaned_text])
    prediction = model.predict(vec_text)[0]
    probability = model.predict_proba(vec_text).max()

    result = {
        "is_phishing": bool(prediction == 1),
        "confidence": float(probability),
        "status": "success"
    }

    return {
        "statusCode": 200,
        "body": json.dumps(result)
    }