import shutil
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import torch
from autodistill.detection import CaptionOntology
from autodistill_grounding_dino import GroundingDINO
from PIL import Image
from tqdm.rich import tqdm

from model.utils.logger import setup_logger


class GroundingDINOLabeler:
    def __init__(
        self,
        source_dir: str = 'imgs',
        output_dir: str = 'ingredients_dataset',
        classes_file: Optional[str] = '../../../assets/classes.txt',
        train_split: float = 0.8,
        val_split: float = 0.15,
        test_split: float = 0.05,
        confidence_threshold: float = 0.45,
        box_threshold: float = 0.35,

        nms_iou_threshold: float = 0.45
    ):

        source_path = Path(source_dir)
        output_path = Path(output_dir)

        if not source_path.is_absolute():
            source_path = Path(__file__).parent / source_path
        if not output_path.is_absolute():
            output_path = Path(__file__).parent / output_path

        self.source_dir = source_path
        self.output_dir = output_path
        self.classes_file = classes_file
        self.train_split = train_split
        self.val_split = val_split
        self.test_split = test_split
        self.confidence_threshold = confidence_threshold
        self.box_threshold = box_threshold

        self.nms_iou_threshold = nms_iou_threshold

        # validate splits
        assert abs(train_split + val_split + test_split - 1.0) < 1e-6

        self.class_names = None
        self.class_to_idx = {}
        self.base_model = None
        self.logger = setup_logger(__name__, "auto_labeling.log")

    # Load class names from classes.txt
    def load_classes(self) -> List[str]:
        if not self.classes_file:
            return []

        classes_path = Path(self.classes_file)

        # Handle relative paths
        if not classes_path.is_absolute():
            classes_path = Path(__file__).parent / classes_path

        if not classes_path.exists():
            self.logger.warning(f"Classes file not found at {classes_path}")
            return []

        if not classes_path.is_file():
            self.logger.warning(f"Classes path exists but is not a file: {classes_path}")
            return []

        try:
            with open(classes_path, 'r', encoding='utf-8') as f:
                classes = [line.strip() for line in f if line.strip()]
                if not classes:
                    self.logger.warning(f"Classes file is empty: {classes_path}")
                return classes
        except Exception as e:
            self.logger.error(f"Error reading classes file {classes_path}: {e}")
            return []

    # Check if ingredient is a packaged product
    def is_packaged_product(self, ingredient: str) -> bool:
        packaged_keywords = ['powder', 'mix', 'sauce', 'paste', 'oil',
                             'extract', 'bouillon', 'stock', 'seasoning', 'half and half',
                             'cream', 'milk', 'vinegar', 'juice', 'ketchup']

        ingredient_lower = ingredient.lower()
        return any(keyword in ingredient_lower for keyword in packaged_keywords)

    # Apply Non-Maximum Suppression to remove overlapping boxes
    def apply_nms(self, yolo_labels: List[Dict], iou_threshold: float = 0.45) -> List[Dict]:
        if len(yolo_labels) <= 1:
            return yolo_labels

        # convert to corner format (x1, y1, x2, y2) for iou calc
        boxes = np.array([
            [
                l['x_center'] - l['width'] / 2,
                l['y_center'] - l['height'] / 2,
                l['x_center'] + l['width'] / 2,
                l['y_center'] + l['height'] / 2
            ]
            for l in yolo_labels
        ])
        scores = np.array([l['confidence'] for l in yolo_labels])

        # sort by confidence (desc)
        order = scores.argsort()[::-1]
        keep = []

        while order.size > 0:
            # choose the box w/ highest confidence
            i = order[0]
            keep.append(i)

            if order.size == 1:
                break

            # calc iou w/ remaining boxes
            xx1 = np.maximum(boxes[i, 0], boxes[order[1:], 0])
            yy1 = np.maximum(boxes[i, 1], boxes[order[1:], 1])
            xx2 = np.maximum(boxes[i, 2], boxes[order[1:], 2])
            yy2 = np.maximum(boxes[i, 3], boxes[order[1:], 3])

            # calc intersection
            w = np.maximum(0, xx2 - xx1)
            h = np.maximum(0, yy2 - yy1)
            intersection = w * h

            # calc union
            area_i = (boxes[i, 2] - boxes[i, 0]) * (boxes[i, 3] - boxes[i, 1])
            area_others = (boxes[order[1:], 2] - boxes[order[1:], 0]) * (boxes[order[1:], 3] - boxes[order[1:], 1])

            union = area_i + area_others - intersection

            # calc iou
            iou = intersection / (union + 1e-6)

            # keep boxes with iou below threshold
            mask = iou <= iou_threshold
            order = order[1:][mask]

        return [yolo_labels[i] for i in keep]

    # Filter detections for packaged products (keep the largest box)
    def filter_packaged_detections(self, yolo_labels: List[Dict], is_packaged: bool) -> List[Dict]:
        if not is_packaged or len(yolo_labels) <= 1:
            return yolo_labels

        # find the largest box by area
        largest_box = max(yolo_labels, key=lambda x: x['width'] * x['height'])
        return [largest_box]

    # Build ontology for GroundingDINO
    def build_ontology(self, class_names: List[str]) -> CaptionOntology:
        ontology_dict = {}

        for class_name in class_names:
            prompts = self.create_detection_prompts(class_name)

            # Autodistill format: {"prompt": "class_name"}
            ontology_dict[prompts[0]] = class_name

        return CaptionOntology(ontology_dict)

    # Create prompts for DINO
    def create_detection_prompts(self, ingredient: str) -> List[str]:
        prompts = [ingredient]

        # add variations based on ingredient type
        ingredient_lower = ingredient.lower()

        # Vegetables and fruits
        if any(veg in ingredient_lower for veg in ['tomato', 'carrot', 'onion', 'potato', 'bell pepper']):
            prompts.append(f"fresh {ingredient}")
            prompts.append(f"{ingredient} vegetable")

        # Herbs
        if any(herb in ingredient_lower for herb in ['basil', 'cilantro', 'mint', 'parsley']):
            prompts.append(f"{ingredient} herb")
            prompts.append(f"fresh {ingredient}")

        # Meats
        if any(meat in ingredient_lower for meat in ['beef', 'pork', 'chicken', 'fish']):
            prompts.append(f"raw {ingredient}")
            prompts.append(f"{ingredient} meat")

        # Packaged products
        if any(pkg in ingredient_lower for pkg in ['powder', 'sauce', 'paste', 'oil']):
            prompts.append(f"{ingredient} bottle")
            prompts.append(f"{ingredient} package")

        # Noodles/pasta
        if any(noodle in ingredient_lower for noodle in ['noodle', 'rice', 'vermicelli']):
            prompts.append(f"dried {ingredient}")

        return prompts

    # Create YOLO dir structure
    def create_dir_structure(self):
        for split in ['train', 'val', 'test']:
            (self.output_dir / split / 'images').mkdir(parents=True, exist_ok=True)
            (self.output_dir / split / 'labels').mkdir(parents=True, exist_ok=True)

    # Get class mapping from classes.txt
    def get_class_mapping(self):
        if self.class_names is None:
            self.class_names = self.load_classes()

        if not self.class_names:
            raise ValueError("No class names available. Either provide a valid classes_file or set class_names directly.")

        self.class_to_idx = {name: idx for idx, name in enumerate(self.class_names)}

        return {name: name for name in self.class_names}

    # Init base model
    def init_base_model(self, ontology: CaptionOntology):
        self.base_model = GroundingDINO(
            ontology = ontology,
            box_threshold = self.box_threshold,
            text_threshold = self.confidence_threshold
        )

    # Split data into train/val/test
    def split_data(self, image_paths: List[Path]):
        import random
        random.seed(42)

        paths = image_paths.copy()
        random.shuffle(paths)

        n_total = len(paths)
        n_train = int(n_total * self.train_split)
        n_val = int(n_total * self.val_split)

        return ( paths[:n_train], paths[n_train:n_train + n_val], paths[n_train + n_val:])

    # Label a single image using GroundingDINO
    def label_single_image(self, image_path: Path, canonical_class: str, class_idx: int) -> Optional[Dict]:
        try:
            detections = self.base_model.predict(str(image_path))

            # Get image dimensions
            with Image.open(image_path) as img:
                img_width, img_height = img.size

            # Check
            if len(detections) == 0:
                return None

            # Convert detections to YOLO format
            yolo_labels = []

            for i in range(len(detections)):
                # get bounding box (x1, y1, x2, y2)
                x1, y1, x2, y2 = detections.xyxy[i]

                # Convert to YOLO format (x_center, y_center, width, height) normalized
                x_center = ((x1 + x2) / 2) / img_width
                y_center = ((y1 + y2) / 2) / img_height
                width = (x2 - x1) / img_width
                height = (y2 - y1) / img_height

                x_center = max(0, min(1, x_center))
                y_center = max(0, min(1, y_center))
                width = max(0, min(1, width))
                height = max(0, min(1, height))

                yolo_labels.append({
                    'class_idx': class_idx,
                    'x_center': x_center,
                    'y_center': y_center,
                    'width': width,
                    'height': height,
                    'confidence': detections.confidence[i] if hasattr(detections, 'confidence') else 1.0
                })

            # apply filtering for packaged products
            is_packaged = self.is_packaged_product(canonical_class)

            if is_packaged:
                # for packaged products => keep only the largest detection
                yolo_labels = self.filter_packaged_detections(yolo_labels, is_packaged)
            else:
                # for fresh ingredients => apply NMS
                yolo_labels = self.apply_nms(yolo_labels, self.nms_iou_threshold)

            return {'labels': yolo_labels, 'num_detections': len(yolo_labels), 'image_size': (img_width, img_height)}

        except Exception as e:
            self.logger.error(f"Error labeling image {image_path}: {e}")
            return None

    # Save labels in YOLO format
    def save_yolo_label(self, labels: List[Dict], output_path: Path):
        with open(output_path, 'w') as f:
            for label in labels:
                f.write(f"{label['class_idx']} "
                        f"{label['x_center']:.6f} "
                        f"{label['y_center']:.6f} "
                        f"{label['width']:.6f} "
                        f"{label['height']:.6f}\n")

    # Process all images in an ingredient folder
    def process_ingredient_folder(self, folder_name: str, canonical_class: str, class_idx: int) -> Dict:
        ingredient_dir = self.source_dir / folder_name

        # Get image files
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.webp'}
        image_paths = [p for p in ingredient_dir.iterdir()
                       if p.is_file() and p.suffix.lower() in image_extensions]

        if not image_paths:
            return {'train': 0, 'val': 0, 'test': 0, 'skipped': 0}

        # split data
        train_paths, val_paths, test_paths = self.split_data(image_paths)

        stats = {'train': 0, 'val': 0, 'test': 0, 'skipped': 0}

        for split, paths in [
            ('train', train_paths),
            ('val', val_paths),
            ('test', test_paths)]:

            for img_path in paths:
                result = self.label_single_image(img_path, canonical_class, class_idx)

                if result is None or len(result['labels']) == 0:
                    stats['skipped'] += 1
                    continue

                # copy image to output dir
                new_filename = f"{canonical_class}_{img_path.stem}{img_path.suffix}"
                output_img_path = self.output_dir / split / 'images' / new_filename
                shutil.copy2(img_path, output_img_path)

                # save label
                label_path = self.output_dir / split / 'labels' / f"{Path(new_filename).stem}.txt"
                self.save_yolo_label(result['labels'], label_path)

                stats[split] += 1

        return stats

    # Creat data.yaml
    def create_data_yaml(self):
        yaml_content = f"""
        path: {self.output_dir.absolute()}
        train: train/images
        val: val/images
        test: test/images

        nc: {len(self.class_names)}
        names: {self.class_names}
        """
        with open(self.output_dir / 'data.yaml', 'w') as f:
            f.write(yaml_content)


    # run the labeling
    def label_dataset(self):
        self.logger.info("Auto-Labeling using Grounding DINO")
        self.logger.info(f"Source dir: {self.source_dir}")
        self.logger.info(f"Output dir: {self.output_dir}")
        self.logger.info(f"Classes file: {self.classes_file}")

        self.create_dir_structure()

        try:
            folder_to_canonical = self.get_class_mapping()
            if self.classes_file:
                self.logger.info(f"Loaded {len(self.class_names)} classes from {self.classes_file}: {self.class_names}")
            else:
                self.logger.info(f"Using {len(self.class_names)} classes set directly")
        except ValueError as e:
            self.logger.error(f"Error: {e}")
            self.logger.error("Please either:")
            self.logger.error("1. Provide a valid classes_file path, or")
            self.logger.error("2. Set class_names directly before calling label_dataset()")
            return {'train': 0, 'val': 0, 'test': 0, 'skipped': 0, 'class_distribution': {}}

        # build ontology and init model
        ontology = self.build_ontology(self.class_names)
        self.init_base_model(ontology)

        # Process each ingredient folder
        total_stats = {'train': 0, 'val': 0, 'test': 0, 'skipped': 0, 'class_distribution': {name: 0 for name in self.class_names}}

        folders = [d.name for d  in self.source_dir.iterdir() if d.is_dir()]
        self.logger.info(f"Processing {len(folders)} ingredient folders...")

        for folder_name in tqdm(folders, desc="Processing folders"):
            if folder_name not in self.class_to_idx:
                self.logger.warning(f"Skipping folder {folder_name} as it's not in classes.txt")
                continue

            canonical_class = folder_name
            class_idx = self.class_to_idx[canonical_class]

            stats = self.process_ingredient_folder(folder_name, canonical_class, class_idx)

            # update totals
            for key in ['train', 'val', 'test', 'skipped']:
                total_stats[key] += stats[key]

            total_stats['class_distribution'][canonical_class] += (stats['train'] + stats['val'] + stats['test'])

        # Create config file
        self.create_data_yaml()

        self.logger.info("Auto-labeling completed")
        self.logger.info(f"Classes labeled: {len(self.class_names)}")
        self.logger.info(f"Train images: {total_stats['train']}")
        self.logger.info(f"Validation images: {total_stats['val']}")
        self.logger.info(f"Test images: {total_stats['test']}")
        self.logger.info(f"Skipped images (no detections): {total_stats['skipped']}")
        self.logger.info(f"Dataset YAML created at: {self.output_dir.absolute()}")

        return total_stats

def main():
    logger = setup_logger(__name__, "auto_labeling_main.log")
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    logger.info(f"CUDA version: {torch.version.cuda}")
    logger.info(f"GPU device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None'}")

    labeler = GroundingDINOLabeler(
        source_dir = Path(__file__).parent / 'imgs',
        output_dir = Path(__file__).parent / 'ingredients_dataset',
        classes_file = Path(__file__).parent.parent.parent.parent / 'assets' / 'classes.txt',
        train_split = 0.8,
        val_split = 0.15,
        test_split = 0.05,
        confidence_threshold = 0.45,
        box_threshold = 0.35,

        nms_iou_threshold = 0.45
    )

    stats = labeler.label_dataset()
    logger.info(f"Final Stats: {stats}")

if __name__ == "__main__":
    main()

