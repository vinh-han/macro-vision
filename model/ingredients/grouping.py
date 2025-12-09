import asyncio
import json
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
from openai import AzureOpenAI
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize
from utils.config import settings
from utils.logger import setup_logger


class Grouper:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint,
        )

        self.raw_ingredients_path = Path("ingredients/raw/ingredients.txt")
        self.removed_ingredients_path = Path("ingredients/out/removed.txt")
        self.classes_path = Path("ingredients/out/classes.txt")
        self.output_dir = Path("ingredients/out")
        self.output_dir.mkdir(exist_ok=True)
        self.logger = setup_logger(__name__, "ingredients/grouping.log")

    def _load_ingredients(self) -> List[str]:
        with open(self.raw_ingredients_path, "r", encoding="utf-8") as f:
            raw = [line.strip() for line in f if line.strip()]

        with open(self.removed_ingredients_path, "r", encoding="utf-8") as f:
            removed = set(line.strip() for line in f if line.strip())

        cleaned = [ing for ing in raw if ing not in removed]

        return cleaned

    def _load_classes(self) -> List[str]:
        with open(self.classes_path, "r", encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip()]

    async def _get_embeddings(
        self, texts: List[str], batch_size: Optional[int] = 100
    ) -> np.ndarray:
        # init result var
        embeddings = []

        for i in range(0, len(texts), batch_size):
            # get current batch
            batch = texts[i : i + batch_size]
            self.logger.info(
                f"[ RUN ]  Getting embeddings for batch {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size}"
            )

            # use azure client to generate embeddings
            response = self.client.embeddings.create(
                input=batch, model=settings.embedding_deployment_name
            )

            # put the batch's embeddings into the result var
            batch_embeddings = [data.embedding for data in response.data]
            embeddings.extend(batch_embeddings)

        return np.array(embeddings)

    async def group_ingredients(self, save: bool = True) -> Dict[str, List[str]]:
        self.logger.info(
            "[ RUN ] Grouping raw ingredients to classes using embeddings..."
        )

        # loading ingredients and classes
        ingredients = self._load_ingredients()
        classes = self._load_classes()

        self.logger.info(f"[ OK ] Loaded {len(ingredients)} raw ingredients")
        self.logger.info(f"[ OK ] Loaded {len(classes)} classes")

        # run thru embedding model
        ingredient_embeddings = await self._get_embeddings(ingredients)
        class_embeddings = await self._get_embeddings(classes)

        # normalize
        ingredient_embeddings = normalize(ingredient_embeddings)
        class_embeddings = normalize(class_embeddings)

        # calculate cosine similarity between ingredient and class embeddings
        # get back a similarity matrix
        self.logger.info("[ RUN ] Computing similarity matrix...")
        similarity_matrix = cosine_similarity(ingredient_embeddings, class_embeddings)

        # init a dict for groupings
        groupings = {cls: [] for cls in classes}

        # groups classes to ingredients by getting the highest similarity class to an ingredient
        for i, ingredient in enumerate(ingredients):
            # first grabs the similarities for the current ingredient
            similarities = similarity_matrix[i]

            # finds the index of the class with the highest ingredients
            # using np.argmax
            best_class_idx = np.argmax(similarities)

            # uses that index to get the actual class from the og list
            best_class = classes[best_class_idx]

            # here we grab the similarity for logging purposes
            best_similarity = similarities[best_class_idx]

            # define a minimum similarity score
            min_similarity = 0.35

            # then jusst append the ingredient to the corresponding class
            # in the groupings dict defined earlier
            # given that it's above the minimum similarity score
            if best_similarity < min_similarity:
                groupings.setdefault("UNCLASSIFIED", []).append(ingredient)
            else:
                groupings[best_class].append(ingredient)

            self.logger.info(
                f"[ OK ] Grouped '{ingredient}' → '{best_class}' (similarity: {best_similarity:.3f})"
            )

        # reformat a lil
        groupings = {cls: ings for cls, ings in groupings.items() if ings}

        self.logger.info(
            f"[ OK ] Grouped {len(ingredients)} ingredients into {len(groupings)} classes"
        )

        # then save
        if save:
            json_file = self.output_dir / "groupings.json"
            with open(json_file, "w", encoding="utf-8") as f:
                json.dump(groupings, f, indent=4, ensure_ascii=False)

            self.logger.info(f"[ OK ] Saved groupings to {json_file}")

        return groupings


if __name__ == "__main__":
    grouper = Grouper()
    asyncio.run(grouper.group_ingredients())
