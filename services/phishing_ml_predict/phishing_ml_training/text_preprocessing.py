"""Shared text normalization used for phishing-model training and inference."""

import re


def clean_text(text: str) -> str:
    """Normalize an email into the feature format used by the trained model."""
    if not isinstance(text, str):
        return ""

    text = text.lower()
    text = re.sub(r"\S*http\S*", " URL ", text)
    text = re.sub(r"\S*www\.\S*", " URL ", text)
    text = re.sub(
        r"(^|\n)(x-[a-z0-9-]+:|received:|return-path:|delivered-to:|authentication-results:).*?(\n|$)",
        " ",
        text,
    )
    text = re.sub(r"\b(enron|vince|louise|hpl|houston|wrote|thanks|original message|pm|am|university|edu)\b", " ", text)
    text = re.sub(r"\b(opensuse|perl|python|java|linux|unix|localhost)\b", " ", text)
    text = re.sub(r"x-spam-summary:.*", "", text)
    text = text.replace("don't delete this message -- folder internal data", "")
    text = text.replace("this text is part of the internal format of your mail folder", "")
    text = re.sub(r"-+\s?forwarded by.*?-+", " ", text)
    text = re.sub(r"\d+", " NUM ", text)
    text = re.sub(r"[^a-z0-9@._ ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()
