import os
import shutil
from pathlib import Path
from typing import List

import requests
from ddgs import DDGS
from PIL import Image
from tqdm.rich import tqdm
from utils.config import settings
from utils.logger import setup_logger


class ImageScraper:
    def __init__(
        self,
        count_per_ingredient=50,
        output_dir: str = "dataset/imgs",
        min_image_size: int = 200,
        max_image_size: int = 5000,
        min_file_size_kb: int = 10
    ):
        self.count_per_ingredient = count_per_ingredient
        self.output_dir = output_dir
        self.min_image_size = min_image_size
        self.max_image_size = max_image_size
        self.min_file_size_kb = min_file_size_kb
        self.logger = setup_logger(__name__, "dataset_scraper.log")

    def _is_packaged_product(self, ingredient: str) -> bool:
        packaged_keywords = [
            'powder', 'mix', 'sauce', 'paste', 'oil', 'extract',
            'bouillon', 'stock', 'spice', 'seasoning', 'half and half',
            'cream', 'milk', 'vinegar', 'soda', 'juice'
        ]
        ingredient_lower = ingredient.lower()
        return any(keyword in ingredient_lower for keyword in packaged_keywords)

    def _build_search_query(self, ingredient: str) -> str:
        if self._is_packaged_product(ingredient):
            return f"{ingredient} product package -recipe -homemade"
        else:
            return f"{ingredient} food ingredient fresh -recipe -dish -meal -cooked -package"

    def _filter_image(self, image_path: Path) -> bool:
        try:
            file_size_kb = image_path.stat().st_size / 1024

            if file_size_kb < self.min_file_size_kb:
                self.logger.info(f"Filtered {image_path.name}: file too small ({file_size_kb:.1f}KB)")
                return False

            with Image.open(image_path) as img:
                width, height = img.size

                if width < self.min_image_size or height < self.min_image_size:
                    self.logger.info(f"Filtered {image_path.name}: dimensions too small ({width}x{height})")
                    return False

                if width > self.max_image_size or height > self.max_image_size:
                    self.logger.info(f"Filtered {image_path.name}: dimensions too large ({width}x{height})")
                    return False

                aspect_ratio = max(width, height) / min(width, height)
                if aspect_ratio > 3:
                    self.logger.info(f"Filtered {image_path.name}: unusual aspect ratio ({aspect_ratio:.2f})")
                    return False

            return True

        except Exception as e:
            self.logger.info(f"Filtered {image_path.name}: error reading image ({e})")
            return False

    def scrape(self, ingredients: List[str]) -> dict:
        results = {}

        for ingredient in tqdm(ingredients, desc="Scraping ingredients"):
            search_query = self._build_search_query(ingredient)
            self.logger.info(
                f"\n[ RUN ] Scraping images for: {ingredient}"
                f"\nSearch query: {search_query}"
            )

            ingredient_dir = Path(self.output_dir) / ingredient
            ingredient_dir.mkdir(parents=True, exist_ok=True)

            with DDGS() as ddgs:
                search_results = ddgs.images(
                    search_query,
                    max_results=self.count_per_ingredient
                )

                for i, r in enumerate(search_results):
                    url = r.get("image")
                    if not url:
                        continue

                    try:
                        img_data = requests.get(url, timeout=10).content
                        ext = url.split(".")[-1][:4].lower()  # avoid very long extensions

                        # Validate image extension
                        valid_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif']
                        if ext not in valid_extensions:
                            self.logger.info(f"[ SKIP ] Invalid extension '{ext}' for {url}")
                            continue

                        file_path = ingredient_dir / f"image_{i}.{ext}"

                        with open(file_path, "wb") as f:
                            f.write(img_data)

                        self.logger.info(f"[ OK ] Saved: {file_path}")

                    except Exception as e:
                        self.logger.info(f"Failed {url}: {e}")

            paths = []
            filtered_count = 0

            if ingredient_dir.exists():
                for img_path in ingredient_dir.glob("*"):
                    if img_path.is_file():
                        if self._filter_image(img_path):
                            paths.append(str(img_path))
                        else:
                            img_path.unlink()
                            filtered_count += 1

            results[ingredient] = paths

            self.logger.info(f"[ OK ] Downloaded {len(paths)} images for {ingredient} (filtered out {filtered_count})")

        return results

if __name__ == "__main__":
    scraper = ImageScraper(count_per_ingredient=10)

    ingredients = settings.ingredients_list

    # Test with a few ingredients
    # test_ingredients = ["tomato", "onion", "garlic"]
    test_ingredients = ingredients[:5]

    results = scraper.scrape(
        test_ingredients
    )
