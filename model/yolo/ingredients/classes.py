import json
from pathlib import Path
from typing import List

from openai import AzureOpenAI

from model.utils.config import settings
from model.utils.logger import setup_logger


class ClassGenerator:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint
        )

        self.raw_ingredients_path = Path(__file__).parent / "../../../assets/ingredients.txt"
        self.removed_ingredients_path = Path(__file__).parent / "../../../assets/removed.txt"
        self.output_dir = Path(__file__).parent / "out"
        self.output_dir.mkdir(exist_ok=True)
        self.logger = setup_logger(__name__, "classes.log")

    def _load_ingredients(self) -> List[str]:
        with open(self.raw_ingredients_path, 'r', encoding='utf-8') as f:
            raw = [line.strip() for line in f if line.strip()]

        with open(self.removed_ingredients_path, 'r', encoding='utf-8') as f:
            removed = set(line.strip() for line in f if line.strip())

        cleaned = [ing for ing in raw if ing not in removed]
        return cleaned

    def _parse_json_response(self, response_content: str) -> List[str]:
        response_content = response_content.strip()

        if response_content.startswith("```json"):
            response_content = response_content[7:]
        if response_content.endswith("```"):
            response_content = response_content[:-3]

        response_content = response_content.strip()
        return json.loads(response_content)

    def generate_classes(self, save: bool = True) -> List[str]:
        self.logger.info("[ RUN ]  Generating model classes from raw ingredients...")

        ingredients = self._load_ingredients()
        self.logger.info(f"[ OK ] Loaded {len(ingredients)} cleaned raw ingredients")

        prompt = f"""
        You are a computer vision expert tasked with generating a list of USABLE CLASSES for training a YOLOv11 object detection model to identify food ingredients.

        You will receive a list of {len(ingredients)} raw ingredients scraped from a website. Your task is to:

        1. ANALYZE the entire ingredients list thoroughly
        2. GENERATE a list of USABLE CLASSES that can be realistically detected by a computer vision model
        3. ENSURE classes are visually distinct and identifiable in images
        4. KEEP ALL SPECIFIC VARIATIONS as separate classes (e.g., "beef shank", "beef sirloin", "beef ribeye" MUST be separate classes)
        5. KEEP specificity where visual differences exist (e.g., "lemon" vs "lime" are visually different, keep both)

        CRITICAL RULES:
        - Classes must be VISUALLY IDENTIFIABLE by a camera
        - DO NOT oversimplify or merge specific cuts/types into generic categories
        - KEEP "beef shank", "beef sirloin", "beef ribeye" as SEPARATE classes - do NOT merge to just "beef"
        - KEEP "chicken breast", "chicken wing", "chicken thigh" as SEPARATE classes
        - Maintain the specificity from the raw ingredients list
        - Only merge items that are truly duplicates or near-duplicates (e.g., "lemon lime" and "lime lemon" → "lemon lime")
        - Target around 100-200 classes maximum

        Raw ingredients list:
        {json.dumps(ingredients, indent=2)}

        Return ONLY a JSON array of class names. No explanations, no markdown, just the JSON array.

        Example format: ["beef shank", "beef sirloin", "beef ribeye", "chicken breast", "chicken wing", "lemon", "lime", "ginger", ...]
        """

        self.logger.info("[ RUN ]  Sending request to LLM...")
        try:
            response = self.client.chat.completions.create(
                model=settings.model_deployment_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=1
            )
        except Exception as e:
            self.logger.info(f"LLM request failed: {e}")

        try:
            response_content = response.choices[0].message.content
            self.logger.info(f"[ OK ] LLM response received:\n{response_content[:200]}...")

            classes = self._parse_json_response(response_content)
            classes.sort()

            self.logger.info(f"[ OK ] Generated {len(classes)} classes")

            if save:
                output_file = self.output_dir / "classes.txt"
                with open(output_file, 'w', encoding='utf-8') as f:
                    for cls in classes:
                        f.write(f"{cls}\n")

                self.logger.info(f"[ OK ] Saved classes to {output_file}")

            return classes

        except json.JSONDecodeError as e:
            self.logger.error(
                f"Failed to parse LLM response: {e}"
                f"\nRAW RESPONSE:\n{response.choices[0].message.content}"
            )
            raise


if __name__ == "__main__":
    generator = ClassGenerator()

    generator.generate_classes()
