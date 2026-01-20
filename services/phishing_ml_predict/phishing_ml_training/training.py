import os
import re
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder

TRAIN_FILES = {
    "Enron": "Enron.csv",
    "CEAS_08": "CEAS_08.csv",
    "SpamAssasin": "SpamAssasin.csv",
    "Ling": "Ling.csv",
}

EXTERNAL_TEST_FILES = {
    "Nazario": "Nazario.csv",
    "Nigerian_Fraud": "Nigerian_Fraud.csv",
}

MODEL_PATH = "core4_phishing_model.joblib"
VECTORIZER_PATH = "core4_tfidf_vectorizer.joblib"


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


def load_corpus(path: str, name: str) -> pd.DataFrame:
    if not os.path.exists(path):
        print(f"Warning: {name} not found at {path}. Skipping.")
        return pd.DataFrame(columns=["text", "label", "dataset"])

    df = pd.read_csv(path)
    needed = ["subject", "body", "label"]
    missing = [c for c in needed if c not in df.columns]
    if missing:
        raise ValueError(f"{name}: missing columns {missing}")

    df = df.dropna(subset=["subject", "body", "label"]).copy()
    df["text"] = (df["subject"].astype(str) + " " + df["body"].astype(str)).apply(clean_text)
    df["dataset"] = name
    return df[["text", "label", "dataset"]]


def main():
    train_dfs = []
    for name, fname in TRAIN_FILES.items():
        print(f"Loading {name}.")
        df = load_corpus(fname, name)
        if not df.empty: train_dfs.append(df)

    print("Loading Nazario.")
    nazario_full = load_corpus("Nazario.csv", "Nazario")
    if nazario_full.empty:
        raise ValueError("Critical: Nazario dataset missing.")

    naz_train, naz_test = train_test_split(nazario_full, test_size=0.2, random_state=42, stratify=nazario_full["label"])
    train_dfs.append(naz_train)

    all_train = pd.concat(train_dfs, ignore_index=True)

    le = LabelEncoder()
    all_potential_labels = pd.concat([all_train['label'], naz_test['label']])
    le.fit(all_potential_labels)

    all_train['label'] = le.transform(all_train['label'])
    naz_test['label'] = le.transform(naz_test['label'])

    X_train_raw, X_val_raw, y_train, y_val = train_test_split(
        all_train["text"], all_train["label"], test_size=0.2, random_state=42, stratify=all_train["label"]
    )

    print("\nTF-IDF fitting now")
    vectorizer = TfidfVectorizer(max_features=15000, ngram_range=(1, 2), min_df=10, stop_words='english')
    X_train_vec = vectorizer.fit_transform(X_train_raw)
    X_val_vec = vectorizer.transform(X_val_raw)

    models = {
        "Logistic Regression": LogisticRegression(max_iter=500, n_jobs=-1, class_weight="balanced"),
        "Naive Bayes": MultinomialNB(),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=20, n_jobs=-1, class_weight="balanced"),
        "SVM (SGD)": SGDClassifier(loss='modified_huber', penalty='l2', max_iter=1000, n_jobs=-1,
                                   class_weight='balanced', random_state=42)
    }

    trained_models = {}

    print("Model Comparison: ")
    best_model_name = None
    best_acc = 0.0

    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train_vec, y_train)
        trained_models[name] = model

        y_pred = model.predict(X_val_vec)
        acc = accuracy_score(y_val, y_pred)

        print(f"   -> Accuracy: {acc:.4f}")

        if acc > best_acc:
            best_acc = acc
            best_model_name = name

    print(f"\n Best model is: {best_model_name} (Acc: {best_acc:.4f}) ===")

    best_clf = trained_models[best_model_name]

    print(f"\nSaving to {MODEL_PATH} and {VECTORIZER_PATH}...")
    joblib.dump(vectorizer, VECTORIZER_PATH)
    joblib.dump(best_clf, MODEL_PATH)


if __name__ == "__main__":
    main()