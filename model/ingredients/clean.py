import os
import re
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

import numpy as np
import spacy
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from utils.logger import setup_logger

LOGGER = setup_logger(__name__, "ingredients_clean.log")

def load_models() -> Tuple[spacy.Language, SentenceTransformer]:
    LOGGER.info("Loading spaCy model...")

    try:
        nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])
    except OSError:
        LOGGER.info("spaCy model not found. Downloading...")
        subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=True)
        nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])

    LOGGER.info("Loading Sentence Transformer model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    return nlp, model

def normalize(text: str) -> str:
    text = re.split(r'[/,()]', text)[0]
    text = re.sub(r'[^a-z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def lemmatize(text: str, nlp: spacy.Language) -> str:
    doc = nlp(text)
    return " ".join([token.lemma_ for token in doc])

def root_match(base: str, item: str) -> bool:
    base_root = base.split()[0]
    return item.startswith(base_root)

def clean(
    input_file: Optional[str] = "raw/99_clean_ingredients.wowa",
    output_file: Optional[str] = "out/clean/cleaned_ingredients.txt",
    log_file: Optional[str] = "out/clean/merge_log.txt",
    threshold: Optional[float] = 0.78
) -> None:
    try:
        cleaned = []
        merge_map = {}
        used = set()
        parent_dir = Path(__file__).parent

        # LOAD MODELS
        nlp, model = load_models()

        # LOAD RAW INGREDIENTS
        with open(Path(parent_dir / input_file), "r", encoding="utf-8") as f:
            ingredients = [line.strip().lower() for line in f if line.strip()]

        # BASIC CLEANING
        normalized = [normalize(i) for i in ingredients if len(i) > 1]
        normalized = list(set(normalized))

        # LEMMATIZING
        lemmatized = [lemmatize(i, nlp) for i in normalized]
        lemmatized = list(set(lemmatized))

        # GENERATE SEMANTIC EMBEDDINGS
        embeddings = model.encode(
            lemmatized,
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        # SMART GROUPING
        for i, ing in enumerate(lemmatized):
            if ing in used:
                continue

            group = [ing]
            sims = cosine_similarity(
                [embeddings[i]],
                embeddings
            )[0]

            for j, sim in enumerate(sims):
                candidate = lemmatized[j]
                if j != i and candidate not in used:
                    if sim >= threshold or root_match(ing, candidate):
                        group.append(candidate)
                        used.add(candidate)

            used.add(ing)
            base = sorted(group, key=len)[0]
            cleaned.append(base)
            merge_map[base] = sorted(group)

        # SAVE RESULTS
        with open(Path(parent_dir / output_file), "w", encoding="utf-8") as f:
            for item in sorted(cleaned):
                f.write(item + "\n")

        # SAVE LOG
        with open(Path(parent_dir / log_file) , "w", encoding="utf-8") as f:
            f.write(f"Original: {len(ingredients)}\nCleaned: {len(cleaned)}\n\n")
            for base, group in merge_map.items():
                if len(group) > 1:
                    f.write(f"{base} <- {', '.join(group)}\n")

        LOGGER.info(f"✅ Cleaning done! {len(cleaned)} items saved to '{Path(parent_dir / output_file)}'")
        LOGGER.info(f"📜 Changes logged to '{Path(parent_dir / log_file)}'")
    except Exception as e:
        LOGGER.error("Failed cleaning file: {e}")
        raise

if __name__ == "__main__":
    clean()