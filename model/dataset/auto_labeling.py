import shutil
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
from autodistill.detection import CaptionOntology
from autodistill_grounding_dino import GroundingDINO
from PIL import Image
from tqdm.rich import tqdm


class GroundingDINOLabeler:
    def __init__(
        self,
        source_dir: str = 'dataset/imgs',
        output_dir: str = 'dataset/ingredients_dataset',
        classes_file: Optional[str] = 'ingredients/out/classes.txt',
        train_split: float = 0.8,
        val_split: float = 0.15,
        test_split: float = 0.05,
        confidence_threshold: float = 0.45,
        box_threshold: float = 0.35,

        nms_iou_threshold: float = 0.45
    ):

        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.classes_file = classes_file
        self.train_split = train_split
        self.val_split = val_split
        self.test_split = test_split
        self.confidence_threshold = confidence_threshold
        self.box_threshold = box_threshold

        self.nms_iou_threshold = nms_iou_threshold

        # validate splits
        assert abs(train_split + val_split + test_split - 1.0) < 1e-6

        self.class_names = []
        self.class_to_idx = {}
        self.base_model = None

    # Load class names from classes.txt
    def load_classes(self) -> List[str]:
        if self.classes_file and Path(self.classes_file).exists():
            with open(self.classes_file, 'r') as f:
                return [line.strip() for line in f if line.strip()]

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
        self.class_names = self.load_classes()
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
            print(f"Error labeling image {image_path}: {e}")
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
        print("-" * 60)
        print("Auto-Labeling using Grounding DINO")
        print("-" * 60)
        print(f"Source dir: {self.source_dir}")
        print(f"Output dir: {self.output_dir}")
        print(f"Classes file: {self.classes_file}")

        self.create_dir_structure()
        folder_to_canonical = self.get_class_mapping()
        print(f"Loaded {len(self.class_names)} classes from {self.classes_file}")

        # build ontology and init model
        ontology = self.build_ontology(self.class_names)
        self.init_base_model(ontology)

        # Process each ingredient folder
        total_stats = {'train': 0, 'val': 0, 'test': 0, 'skipped': 0, 'class_distribution': {name: 0 for name in self.class_names}}

        folders = [d.name for d  in self.source_dir.iterdir() if d.is_dir()]
        print("-" * 60)
        print(f"Processing {len(folders)} ingredient folders...")
        print("-" * 60)

        for folder_name in tqdm(folders, desc="Processing folders"):
            if folder_name not in self.class_to_idx:
                print(f"Skipping folder {folder_name} as it's not in classes.txt")
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

        print("-" * 60)
        print("Auto-labeling completed!!!!!!!!!!")
        print("-" * 60)
        print(f"Classes labeled: {len(self.class_names)}")
        print(f"Train images: {total_stats['train']}")
        print(f"Validation images: {total_stats['val']}")
        print(f"Test images: {total_stats['test']}")
        print(f"Skipped images (no detections): {total_stats['skipped']}")
        print("Dataset YAML created at:", {self.output_dir.absolute()})

        return total_stats

def main():
    import torch
    print(f"CUDA available: {torch.cuda.is_available()}")
    print(f"CUDA version: {torch.version.cuda}")
    print(f"GPU device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None'}")

    labeler = GroundingDINOLabeler(
        source_dir = Path('dataset/imgs'),
        output_dir = Path('dataset/ingredients_dataset'),
        classes_file = 'ingredients/out/classes.txt',
        train_split = 0.8,
        val_split = 0.15,
        test_split = 0.05,
        confidence_threshold = 0.45,
        box_threshold = 0.35,

        nms_iou_threshold = 0.45
    )

    stats = labeler.label_dataset()
    print("Final Stats:", stats)

if __name__ == "__main__":
    main()

