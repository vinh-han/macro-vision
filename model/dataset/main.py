import random
from pathlib import Path
from typing import Dict, List, Optional

from dataset.auto_labeling import GroundingDINOLabeler
from dataset.image_scraper import ImageScraper
from dataset.refiner import Refiner
from dataset.viz_labels import YOLOVisualizer
from utils.config import settings
from utils.logger import setup_logger


class DatasetPipeline:
    def __init__(
        self,
        ingredients: List[str],
        count_per_ingredient: int = 100,
        confidence_threshold: float = 0.45,
        box_threshold: float = 0.35,
        nms_iou_threshold: float = 0.45,
        train_split: float = 0.8,
        val_split: float = 0.15,
        test_split: float = 0.05,
        images_dir: str = "dataset/imgs",
        labels_dir: str = "dataset/labels",
        output_dir: str = "dataset/ingredients_dataset"
    ):
        self.ingredients = ingredients
        self.count_per_ingredient = count_per_ingredient
        self.images_dir = images_dir
        self.labels_dir = labels_dir
        self.output_dir = output_dir
        self.train_split = train_split

        self.scraper = ImageScraper(
            count_per_ingredient=count_per_ingredient,
            output_dir=images_dir
        )

        self.labeler = GroundingDINOLabeler(
            source_dir=images_dir,
            output_dir=output_dir,
            classes_file=None,
            train_split=train_split,
            val_split=val_split,
            test_split=test_split,
            confidence_threshold=confidence_threshold,
            box_threshold=box_threshold,
            nms_iou_threshold=nms_iou_threshold
        )

        self.refiner = Refiner(images_dir=images_dir, labels_dir=labels_dir)
        self.visualizer = YOLOVisualizer(dataset_dir=output_dir)

        self.logger = setup_logger(__name__, "dataset_pipeline.log")

    def run_scraping(self) -> Dict[str, List[str]]:
        self.logger.info("[ RUN ]  Scraping Images")

        results = self.scraper.scrape(ingredients=self.ingredients)

        total_images = sum(len(paths) for paths in results.values())
        self.logger.info(f"[ OK ] Scraped {total_images} images across {len(self.ingredients)} ingredients")

        return results

    def run_labeling(self) -> Dict:
        self.logger.info("[ RUN ]  Auto-Labeling Images with Grounding DINO")

        self.labeler.class_names = self.ingredients
        self.labeler.class_to_idx = {name: idx for idx, name in enumerate(self.ingredients)}

        stats = self.labeler.label_dataset()

        self.logger.info(f"[ OK ] Labeled {stats['train'] + stats['val'] + stats['test']} images")
        self.logger.info(f"[ OK ] Train: {stats['train']}, Val: {stats['val']}, Test: {stats['test']}")
        self.logger.info(f"[ OK ] Skipped: {stats['skipped']}")

        return stats

    def run_visualization(self, split: str = "train", num_samples: int = 5, save_output: bool = False) -> None:
        self.logger.info(f"[ RUN ]  Visualizing {split} dataset samples")

        self.visualizer.visualize_dataset(
            split=split,
            num_samples=num_samples,
            save_output=save_output,
            output_dir="dataset/visualizations"
        )

        self.logger.info(f"[ OK ] Visualization complete")

    def run_refinement(self) -> None:
        self.logger.info("[ RUN ]  Refining Dataset")

        yaml_path = self.refiner.create_yolo_dataset_yaml(
            output_path="dataset/dataset.yaml",
            class_names=self.ingredients,
            train_split=self.train_split
        )
        self.logger.info(f"[ OK ] Created YOLO dataset config: {yaml_path}")

        coco_path = self.refiner.export_to_coco(
            output_path="dataset/annotations.json",
            class_names=self.ingredients
        )
        self.logger.info(f"[ OK ] Exported COCO annotations: {coco_path}")

    def run_full_pipeline(self, visualize: bool = False, viz_samples: int = 5) -> None:
        self.logger.info("Starting Full Dataset Pipeline")

        scrape_results = self.run_scraping()

        label_stats = self.run_labeling()

        if visualize:
            self.run_visualization(split="train", num_samples=viz_samples, save_output=True)

        self.logger.info("[ OK ] Pipeline Complete!")
        self.logger.info(
            f"\nDataset Summary:\n"
            f"Ingredients: {len(self.ingredients)}\n"
            f"Total Images: {label_stats['train'] + label_stats['val'] + label_stats['test']}\n"
            f"Train: {label_stats['train']}, Val: {label_stats['val']}, Test: {label_stats['test']}\n"
            f"Skipped: {label_stats['skipped']}"
        )


if __name__ == "__main__":
    # INGREDIENTS LIST
    ingredients = ["tomato", "onion", "garlic"]
    # ingredients = settings.ingredients_list[:5]

    pipeline = DatasetPipeline(
        ingredients=ingredients,
        count_per_ingredient=100,
        confidence_threshold=0.45,
        box_threshold=0.35,
        nms_iou_threshold=0.45,
        train_split=0.8,
        val_split=0.15,
        test_split=0.05
    )

    # RUN FULL PIPELINE
    pipeline.run_full_pipeline(visualize=False, viz_samples=5)
