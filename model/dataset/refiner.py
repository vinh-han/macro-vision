import json
import os
import shutil
from pathlib import Path
from typing import Dict, List, Optional

import yaml
from PIL import Image


class Refiner:
    def __init__(self, images_dir: str, labels_dir: str):
        self.images_dir = Path(images_dir)
        self.labels_dir = Path(labels_dir)

    def create_yolo_dataset_yaml(
        self,
        output_path: str,
        class_names: List[str],
        train_split: float = 0.8
    ) -> str:

        # Collect images from nested folders (e.g., imgs/tomato/*.jpg, imgs/onion/*.jpg)
        image_files = []
        image_files.extend(self.images_dir.glob("**/*.jpg"))
        image_files.extend(self.images_dir.glob("**/*.png"))
        image_files.extend(self.images_dir.glob("**/*.jpeg"))

        split_idx = int(len(image_files) * train_split)
        train_images = image_files[:split_idx]
        val_images = image_files[split_idx:]

        # Create train/val directories
        train_img_dir = self.images_dir.parent / "train" / "images"
        train_lbl_dir = self.images_dir.parent / "train" / "labels"
        val_img_dir = self.images_dir.parent / "val" / "images"
        val_lbl_dir = self.images_dir.parent / "val" / "labels"

        for d in [train_img_dir, train_lbl_dir, val_img_dir, val_lbl_dir]:
            d.mkdir(parents=True, exist_ok=True)

        # Copy files
        for img in train_images:
            shutil.copy(img, train_img_dir / img.name)

            # Find label with preserved folder structure
            relative_path = img.relative_to(self.images_dir)
            label = self.labels_dir / relative_path.parent / f"{img.stem}.txt"

            if label.exists():
                shutil.copy(label, train_lbl_dir / label.name)

        for img in val_images:
            shutil.copy(img, val_img_dir / img.name)

            # Find label with preserved folder structure
            relative_path = img.relative_to(self.images_dir)
            label = self.labels_dir / relative_path.parent / f"{img.stem}.txt"

            if label.exists():
                shutil.copy(label, val_lbl_dir / label.name)

        # Create YAML
        dataset_config = {
            "path": str(self.images_dir.parent.absolute()),
            "train": "train/images",
            "val": "val/images",
            "nc": len(class_names),
            "names": class_names
        }

        with open(output_path, 'w') as f:
            yaml.dump(dataset_config, f, default_flow_style=False)

        print(f"Created dataset.yaml with {len(train_images)} train, {len(val_images)} val images")

        return output_path


    def export_to_coco(self, output_path: str, class_names: List[str]) -> str:
        coco_format = {
            "images": [],
            "annotations": [],
            "categories": []
        }

        # Add categories
        for idx, name in enumerate(class_names):
            coco_format["categories"].append({
                "id": idx,
                "name": name,
                "supercategory": "ingredient"
            })

        annotation_id = 0

        # Collect images from nested folders
        image_files = []
        image_files.extend(self.images_dir.glob("**/*.jpg"))
        image_files.extend(self.images_dir.glob("**/*.png"))
        image_files.extend(self.images_dir.glob("**/*.jpeg"))

        for img_id, img_path in enumerate(image_files):
            # Add image info
            img = Image.open(img_path)
            width, height = img.size

            # Use relative path for file_name to preserve folder structure
            relative_path = img_path.relative_to(self.images_dir)

            coco_format["images"].append({
                "id": img_id,
                "file_name": str(relative_path),
                "width": width,
                "height": height
            })

            # Find label with preserved folder structure
            label_path = self.labels_dir / relative_path.parent / f"{img_path.stem}.txt"
            if not label_path.exists():
                continue

            with open(label_path, 'r') as f:
                for line in f:
                    parts = line.strip().split()

                    if len(parts) < 5:
                        continue

                    class_id = int(parts[0])
                    x_center, y_center, w, h = map(float, parts[1:5])

                    # Convert YOLO to COCO format (x, y, width, height in pixels)
                    x = (x_center - w/2) * width
                    y = (y_center - h/2) * height
                    box_width = w * width
                    box_height = h * height

                    coco_format["annotations"].append({
                        "id": annotation_id,
                        "image_id": img_id,
                        "category_id": class_id,
                        "bbox": [x, y, box_width, box_height],
                        "area": box_width * box_height,
                        "iscrowd": 0
                    })

                    annotation_id += 1

        with open(output_path, 'w') as f:
            json.dump(coco_format, f, indent=2)

        print(f"Exported {len(coco_format['images'])} images with {len(coco_format['annotations'])} annotations to COCO format")
        return output_path


    def filter_low_confidence(self, confidence_file: str, min_confidence: float = 0.5):
        with open(confidence_file, 'r') as f:
            confidences = json.load(f)

        removed_count = 0

        for img_name, boxes in confidences.items():
            # Handle nested folder structure
            img_path = Path(img_name)

            # Try to find label in nested structure
            label_path = self.labels_dir / img_path.parent / f"{img_path.stem}.txt"

            # Fallback to flat structure if not found
            if not label_path.exists():
                label_path = self.labels_dir / f"{img_path.stem}.txt"

            if not label_path.exists():
                continue

            # Read existing labels
            with open(label_path, 'r') as f:
                lines = f.readlines()

            # Filter by confidence
            filtered_lines = []

            for idx, line in enumerate(lines):
                if idx < len(boxes) and boxes[idx] >= min_confidence:
                    filtered_lines.append(line)

                else:
                    removed_count += 1

            # Rewrite file
            with open(label_path, 'w') as f:
                f.writelines(filtered_lines)

        print(f"Removed {removed_count} low-confidence boxes")

if __name__ == "__main__":
    # Example usage
    refiner = Refiner(images_dir="dataset/imgs", labels_dir="dataset/labels")

    class_names = ["tomato", "onion", "garlic"]

    # Create YOLO dataset structure
    refiner.create_yolo_dataset_yaml("dataset/dataset.yaml", class_names)

    # Export to COCO for manual refinement in CVAT/Label Studio
    refiner.export_to_coco("dataset/annotations.json", class_names)
