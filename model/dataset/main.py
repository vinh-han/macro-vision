from pathlib import Path
from typing import Dict, List, Optional

from dataset.image_scraper import ImageScraper
from dataset.labeler import Labeler
from dataset.refiner import Refiner
from utils.config import settings
from utils.logger import setup_logger


class DatasetPipeline:
    def __init__(
        self,
        ingredients: List[str],
        count_per_ingredient: int = 100,
        labeler_model: str = "yolo11l.pt",
        confidence_threshold: float = 0.5,
        images_dir: str = "dataset/imgs",
        labels_dir: str = "dataset/labels"
    ):
        self.ingredients = ingredients
        self.count_per_ingredient = count_per_ingredient
        self.images_dir = images_dir
        self.labels_dir = labels_dir

        self.scraper = ImageScraper(
            count_per_ingredient=count_per_ingredient,
            output_dir=images_dir
        )
        self.labeler = Labeler(
            model_name=labeler_model,
            confidence_threshold=confidence_threshold
        )
        self.refiner = Refiner(images_dir=images_dir, labels_dir=labels_dir)

        self.logger = setup_logger(__name__, "dataset_pipeline.log")

        self.class_mapping = {name: idx for idx, name in enumerate(ingredients)}

    def run_scraping(self) -> Dict[str, List[str]]:
        self.logger.info("[ RUN ]  Scraping Images")

        results = self.scraper.scrape(ingredients=self.ingredients)

        total_images = sum(len(paths) for paths in results.values())
        self.logger.info(f"[ OK ] Scraped {total_images} images across {len(self.ingredients)} ingredients")

        return results

    def run_labeling(self) -> Dict[str, int]:
        self.logger.info("[ RUN ]  Auto-Labeling Images")

        stats = self.labeler.label_batch(
            image_dir=self.images_dir,
            output_dir=self.labels_dir,
            class_mapping=self.class_mapping,
            use_folder_as_label=True
        )

        self.logger.info(f"[ OK ] Labeled {stats['labeled_images']}/{stats['total_images']} images")
        self.logger.info(f"[ OK ] Created {stats['total_boxes']} bounding boxes")

        return stats

    def run_refinement(self, train_split: float = 0.8) -> None:
        self.logger.info("`[ RUN ]  Refining Dataset")

        # Create YOLO dataset structure
        yaml_path = self.refiner.create_yolo_dataset_yaml(
            output_path="dataset/dataset.yaml",
            class_names=self.ingredients,
            train_split=train_split
        )
        self.logger.info(f"[ OK ] Created YOLO dataset config: {yaml_path}")

        # Export to COCO format
        coco_path = self.refiner.export_to_coco(
            output_path="dataset/annotations.json",
            class_names=self.ingredients
        )
        self.logger.info(f"[ OK ] Exported COCO annotations: {coco_path}")

    def run_full_pipeline(self, train_split: float = 0.8) -> None:
        self.logger.info("Starting Full Dataset Pipeline")

        # Step 1: Scrape images
        scrape_results = self.run_scraping()

        # Step 2: Auto-label
        label_stats = self.run_labeling()

        # Step 3: Refine and export
        self.run_refinement(train_split=train_split)

        self.logger.info("[ OK ] Pipeline Complete!")
        self.logger.info(
            f"\nDataset Summary:"
            f"Ingredients: {len(self.ingredients)}"
            f"Total Images: {label_stats['total_images']}"
            f"Labeled Images: {label_stats['labeled_images']}"
        )

if __name__ == "__main__":
    # FULL INGREDIENTS LIST
    ingredients = ["tomato", "onion", "garlic"]
    # ingredients = settings.ingredients_list[:5]

    # INIT PIPELINE
    pipeline = DatasetPipeline(
        ingredients=ingredients,
        count_per_ingredient=100,
        confidence_threshold=0.5
    )

    # RUN FULL PIPELINE
    pipeline.run_full_pipeline(train_split=0.8)
