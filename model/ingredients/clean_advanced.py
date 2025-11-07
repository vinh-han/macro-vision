import asyncio
import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple

import numpy as np
import openai
from openai import AzureOpenAI
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_similarity
from utils.config import settings
from utils.logger import setup_logger


class Cleaner:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint
        )

        self.raw_ingredients_path = Path("ingredients/raw/ingredients.txt")
        self.output_dir = Path("ingredients/out/clean_advanced")
        self.output_dir.mkdir(exist_ok=True)
        self.logger = setup_logger(__name__, "ingredients_clean_advanced.log")

    # ===============================================
    # INGREDIENTS LOADING AND PREPROCESSING
    # ===============================================

    def load_raw_ingredients(self) -> List[str]:
        with open(self.raw_ingredients_path, 'r', encoding='utf-8') as f:
            ingredients = [line.strip() for line in f if line.strip()]

        self.logger.info(f"Loaded {len(ingredients)} raw ingredients")

        return ingredients

    def preprocess(self, ingredients: List[str]) -> List[str]:
        filtered = []

        # Remove cooking equipment and non-food items
        equipment_keywords = {
            'blender', 'steamer', 'fryer', 'pan', 'bowl', 'bottle', 'bag', 'package',
            'can', 'jar', 'wrap', 'paper', 'brush', 'mold', 'ricer', 'processor',
            'cooker', 'scale', 'toothpick', 'cleave', 'teaspooon'
        }

        for ingredient in ingredients:
            words = ingredient.lower().split()

            if not any(keyword in ingredient.lower() for keyword in equipment_keywords):
                cleaned = re.sub(r'^(tablespoon|teaspoon|cup|inch|piece|pinch|dash|handful|bunch|bundle|stalk|sprig|head|half|medium|package|can)\s+', '', ingredient)
                cleaned = re.sub(r'^\d+\s*', '', cleaned)

                cleaned = cleaned.strip()

                if cleaned and len(cleaned) > 2:
                    filtered.append(cleaned)

        self.logger.info(f"After preprocessing: {len(filtered)} ingredients")
        return filtered

    # ===============================================
    # EMBEDDINGS BASED CLEANING
    # ===============================================

    async def get_embeddings(self, texts: List[str]) -> np.ndarray:
        embeddings = []
        batch_size = 100

        # increment in batch sizes
        for i in range(0, len(texts), batch_size):

            # major slicin
            batch = texts[i : (i + batch_size)]

            self.logger.info(f"Getting embeddings for batch {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size}")

            response = self.client.embeddings.create(
                input=batch,
                model=settings.embedding_deployment_name
            )

            batch_embeddings = [data.embedding for data in response.data]

            embeddings.extend(batch_embeddings)

        # return as numpy array
        return np.array(embeddings)


    async def cluster_by_embeddings(self, ingredients: List[str], target_clusters: int = 150) -> Dict[int, List[str]]:
        self.logger.info("Starting embeddings-based clustering...")

        # feed in ingredients and get embeddings
        embeddings = await self.get_embeddings(ingredients)

        # define the clustering method
        clustering = AgglomerativeClustering(
            n_clusters=target_clusters,
            metric='cosine',
            linkage='average'
        )

        # perform clustering
        cluster_labels = clustering.fit_predict(embeddings)

        # group ingredients by cluster
        clusters = {}

        for i, label in enumerate(cluster_labels):
            if label not in clusters:
                clusters[label] = []

            clusters[label].append(ingredients[i])

        self.logger.info(f"Created {len(clusters)} clusters")

        return clusters

    def select_representative_from_cluster(self, cluster_ingredients: List[str]) -> str:
        if len(cluster_ingredients) == 1:
            return cluster_ingredients[0]

        # prefer shorter, more general terms
        # sort by length and commonality
        sorted_ingredients = sorted(
            cluster_ingredients,
            key=lambda x: (len(x), x.count(' '))
        )

        # Remove very specific measurements or preparations
        for ingredient in sorted_ingredients:
            if not re.search(r'\d+|tablespoon|teaspoon|cup|inch|piece|pinch|dash', ingredient.lower()):
                return ingredient

        return sorted_ingredients[0]


    async def clean_with_embeddings(self) -> List[str]:
        """master func for cleaning with embeddings"""

        ingredients = self.load_raw_ingredients()

        preprocessed = self.preprocess(ingredients)

        # remove dupes while preserving order
        unique_ingredients = list(dict.fromkeys(preprocessed))
        self.logger.info(f"After deduplication: {len(unique_ingredients)} ingredients")

        # cluster similar ingredients
        clusters = await self.cluster_by_embeddings(unique_ingredients, target_clusters=150)

        # select representative from each cluster
        cleaned_ingredients = []

        for cluster_id, cluster_ingredients in clusters.items():
            representative = self.select_representative_from_cluster(cluster_ingredients)

            cleaned_ingredients.append(representative)

            if len(cluster_ingredients) > 1:
                self.logger.info(f"Cluster {cluster_id}: {representative} <- {cluster_ingredients}")

        cleaned_ingredients.sort()

        self.logger.info(f"Final embeddings-based result: {len(cleaned_ingredients)} ingredients")

        return cleaned_ingredients


    def clean_with_llm(self) -> List[str]:
        self.logger.info("Starting LLM-based cleaning...")
        ingredients = self.load_raw_ingredients()
        preprocessed = self.preprocess(ingredients)
        unique_ingredients = list(dict.fromkeys(preprocessed))

        # Process in batches for LLM
        batch_size = 50
        all_cleaned = []

        for i in range(0, len(unique_ingredients), batch_size):
            batch = unique_ingredients[i:i + batch_size]
            self.logger.info(f"Processing LLM batch {i//batch_size + 1}/{(len(unique_ingredients) + batch_size - 1)//batch_size}")

            prompt = f"""
            Clean and standardize these ingredients. Return ONLY a JSON array.

            Ingredients: {json.dumps(batch)}

            Rules:
            - Remove duplicates and near-duplicates
            - Generalize specific items (e.g., "beef chuck rib" -> "beef")
            - Remove equipment and measurements
            - Standardize names
            - Keep only food ingredients

            Return format: ["ingredient1", "ingredient2", ...]

            Your entire response MUST be a single valid JSON object.
            - Do NOT wrap the JSON in quotes.
            - Do NOT escape characters with backslashes.
            - Do NOT include explanations, markdown, or code fences.
            - Output only the raw JSON.
            """

            response = self.client.chat.completions.create(
                model=settings.model_deployment_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=1
            )


            try:
                response_content = response.choices[0].message.content
                self.logger.info(f"LLM response for batch {i//batch_size + 1}: {response_content[:200]}...")

                if not response_content or response_content.strip() == "":
                    self.logger.error(f"Empty response from LLM for batch {i//batch_size + 1}")
                    continue

                # if response is wrapped in markdown or formatted differently
                # try to extract JSON
                response_content = response_content.strip()

                if response_content.startswith("```json"):
                    response_content = response_content[7:]
                if response_content.endswith("```"):
                    response_content = response_content[:-3]

                response_content = response_content.strip()

                # load the repsonse content as json
                cleaned_batch = json.loads(response_content)

                all_cleaned.extend(cleaned_batch)
            except json.JSONDecodeError as e:
                self.logger.error(f"Failed to parse LLM response for batch {i//batch_size + 1}: {e}")
                self.logger.error(f"Raw response: {response.choices[0].message.content}")

        # final deduplication and sorting
        final_cleaned = list(dict.fromkeys(all_cleaned))
        final_cleaned.sort()

        if len(final_cleaned) > 200:
            final_cleaned = self._consolidate(final_cleaned)

        self.logger.info(f"Final LLM-based result: {len(final_cleaned)} ingredients")
        return final_cleaned

    def _consolidate(self, ingredients: List[str]) -> List[str]:
        self.logger.info("Performing final LLM consolidation...")

        prompt = f"""Consolidate these {len(ingredients)} ingredients to ~150 by merging similar items and using broader categories.
        Ingredients: {json.dumps(ingredients)}
        Return format: ["ingredient1", "ingredient2", ...]
        Your entire response MUST be a single valid JSON object.
            - Do NOT wrap the JSON in quotes.
            - Do NOT escape characters with backslashes.
            - Do NOT include explanations, markdown, or code fences.
            - Output only the raw JSON.
        """

        response = self.client.chat.completions.create(
            model=settings.model_deployment_name,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=1
        )

        try:
            response_content = response.choices[0].message.content
            self.logger.info(f"Final consolidation response: {response_content[:200]}...")

            if not response_content or response_content.strip() == "":
                self.logger.error("Empty response from LLM for final consolidation")
                return ingredients[:150]

            response_content = response_content.strip()

            if response_content.startswith("```json"):
                response_content = response_content[7:]
            if response_content.endswith("```"):
                response_content = response_content[:-3]

            response_content = response_content.strip()

            consolidated = json.loads(response_content)
            return sorted(consolidated)

        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse final consolidation response: {e}")
            self.logger.error(f"Raw response: {response.choices[0].message.content}")
            return ingredients[:150]  # Fallback: just take first 150


    def save_results(self, ingredients: List[str], method: str):
        output_file = self.output_dir / f"{method}" /  f"cleaned_ingredients_{method}.txt"

        with open(output_file, 'w', encoding='utf-8') as f:
            for ingredient in ingredients:
                f.write(f"{ingredient}\n")

        self.logger.info(f"Saved {len(ingredients)} ingredients to {output_file}")

        # also save as JSON for easier programmatic access
        json_file = self.output_dir / f"{method}" / f"cleaned_ingredients_{method}.json"

        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(ingredients, f, indent=2, ensure_ascii=False)

        self.logger.info(f"Saved JSON version to {json_file}")

    async def run(self):
        self.logger.info("Starting ingredient cleaning with both methods...")

        # embeddings
        try:
            self.logger.info("Running embeddings-based cleaning...")
            embeddings_result = await self.clean_with_embeddings()

            self.save_results(embeddings_result, "embeddings")
        except Exception as e:
            self.logger.error(f"Embeddings method failed: {e}")


        # llm
        try:
            self.logger.info("Running LLM-based cleaning...")
            llm_result = self.clean_with_llm()

            self.save_results(llm_result, "llm")
        except Exception as e:

            self.logger.error(f"LLM method failed: {e}")

        self.logger.info("Ingredient cleaning completed!")


if __name__ == "__main__":
    cleaner = Cleaner()

    asyncio.run(cleaner.run())

    print("\nCleaning completed! Check the 'ingredients/out/' directory for results.")