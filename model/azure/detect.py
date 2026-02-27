import base64
import json
import time
from pathlib import Path
from typing import Dict, List, Optional

from openai import AzureOpenAI

from model.utils.config import settings
from model.utils.logger import setup_logger


class AzureLLMDetector:
    def __init__(
        self,
        classes_path: Optional[Path] = None,
        model_name: Optional[str] = None
    ):
        self.client = AzureOpenAI(
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint
        )

        self.model_name = model_name or settings.model_deployment_name

        self.classes_path = classes_path or Path(__file__).parent / "../../assets/classes.txt"
        self.ingredients = self._load_ingredients()

        self.logger = setup_logger(__name__, "azure_llm.log")
        self.image_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

    def _load_ingredients(self) -> List[str]:
        with open(self.classes_path, "r", encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip()]

    def _encode_image(self, image_path: Path) -> str:
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    def _build_prompt(self) -> str:
        ingredients_list = ", ".join(self.ingredients)

        prompt = f"""You are an expert food ingredient detector. Analyze the image and identify which ingredients from the following list are visible in the image.

        INGREDIENT LIST (213 classes):
        {ingredients_list}

        INSTRUCTIONS:
        1. Only identify ingredients that are CLEARLY VISIBLE in the image
        2. Return the ingredient names from the list above that match what you see. Be as SPECIFIC as possible - if you see "pork shoulder", return "pork shoulder" not just "pork" (if available from the list). Only use the generic term if you cannot determine the specific type.
        3. Format your response as a JSON array of ingredient names
        4. Do NOT include ingredients that are not in the list above
        5. Do NOT make assumptions about ingredients that are not visible

        RESPONSE FORMAT:
        ["tomato", "onion", "garlic"]

        If no ingredients from the list are visible, return an empty array: []
        """
        return prompt

    def predict_ingredients(self, image_path: Path) -> List[str]:
        start_time = time.time()
        self.logger.info(f"LLM analyzing image: {image_path}")

        try:
            base64_image = self._encode_image(image_path)
            prompt = self._build_prompt()

            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                # temperature=0.0,
                # max_tokens=2000
            )

            content = response.choices[0].message.content.strip()

            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            detections = json.loads(content)

            results = [ing for ing in detections if ing in self.ingredients]

            elapsed_time = time.time() - start_time
            self.logger.info(f"LLM detected {len(results)} ingredients in {image_path} (took {elapsed_time:.2f}s)")
            return results

        except Exception as e:
            self.logger.error(f"Error analyzing image {image_path}: {e}")
            return []

    def predict_folder(self, folder: Path) -> Dict[str, List[str]]:
        outputs = {}
        for img in folder.iterdir():
            if img.suffix.lower() in self.image_exts:
                outputs[img.name] = self.predict_ingredients(img)
        return outputs


if __name__ == "__main__":
    detector = AzureLLMDetector()

    img = Path(__file__).parent / "../c.jpg"

    if img.exists():
        preds = detector.predict_ingredients(img)

        print("\nDetected ingredients:")
        # for name in preds:
        #     print(f"  - {name}")

        print(preds)
    else:
        print(f"Test image not found: {img}")
