import os
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
from tqdm import tqdm
from tqdm.rich import tqdm, trange
from ultralytics import YOLO
from utils.logger import setup_logger


class Labeler:
    """Generate bounding boxes using pretrained models."""

    def __init__(
        self,
        model_name: str = "yolov8m.pt",
        confidence_threshold: float = 0.25
    ):
        self.confidence_threshold = confidence_threshold
        self.logger = setup_logger(__name__, "dataset_labeler.log")
        self.download_yolo_models()
        self.model = YOLO(Path("dataset/pretrained") / model_name)

    def download_yolo_models(self, output_dir: str = "dataset/pretrained"):
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        models = [
            "yolov8n.pt",
            "yolov8s.pt",
            "yolov8m.pt",
            "yolo11n.pt",
            "yolo11m.pt",
            "yolo11l.pt"
        ]

        self.logger.info("[ RUN ] Downloading YOLO models...")
        for model_name in models:
            model_path = output_path / model_name
            if model_path.exists():
                self.logger.info(f"[ RUN ] {model_name} already exists, skipping...")
                continue

            self.logger.info(f"[ RUN ] Downloading {model_name}...")
            model = YOLO(model_name)

            # Save to target directory
            shutil.copy(model_name, str(model_path))

            # Clean up the downloaded file in current directory if it exists
            if Path(model_name).exists() and Path(model_name) != model_path:
                os.remove(model_name)

            self.logger.info(f"[ OK ] {model_name} saved to {model_path}")

        self.logger.info("[ OK ] All models downloaded!")

    def label_image(
        self,
        image_path: str,
        target_classes: Optional[List[str]] = None
    ) -> List[Dict]:

        results = self.model(
            image_path,
            conf=self.confidence_threshold,
            verbose=False
        )
        detections = []

        if len(results) == 0:
            return detections

        result = results[0]
        img_height, img_width = result.orig_shape

        for box in result.boxes:
            class_id = int(box.cls[0])
            class_name = result.names[class_id]
            confidence = float(box.conf[0])

            # Filter by target classes if specified
            if target_classes and class_name not in target_classes:
                continue

            # Get bbox in xyxy format and convert to YOLO format (normalized xywh)
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()

            x_center = ((x1 + x2) / 2) / img_width
            y_center = ((y1 + y2) / 2) / img_height
            width = (x2 - x1) / img_width
            height = (y2 - y1) / img_height

            detections.append({
                "class": class_name,
                "bbox": [x_center, y_center, width, height],
                "confidence": confidence
            })

        return detections

    def label_batch(
        self,
        image_dir: str,
        output_dir: str,
        class_mapping: Optional[Dict[str, int]] = None,
        use_folder_as_label: bool = True,
        target_classes: Optional[List[str]] = None
    ) -> Dict[str, int]:
        image_dir = Path(image_dir)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Collect images
        image_files = []
        image_files.extend(image_dir.glob("**/*.jpg"))
        image_files.extend(image_dir.glob("**/*.png"))
        image_files.extend(image_dir.glob("**/*.jpeg"))

        stats = {"total_images": len(image_files), "labeled_images": 0, "total_boxes": 0}

        for img_path in tqdm(image_files, desc="Auto-labeling images"):
            # Get ingredient name from parent folder
            ingredient_name = img_path.parent.name if use_folder_as_label else None

            # Run detection with target_classes filtering
            detections = self.label_image(
                str(img_path),
                target_classes=target_classes
            )

            # If no detections from YOLO, create a full-image bounding box
            if not detections:
                # Create a bounding box covering most of the image
                # covering 90% of image
                detections = [{
                    "class": ingredient_name or "unknown",
                    "bbox": [0.5, 0.5, 0.9, 0.9],
                    "confidence": 1.0
                }]

            # Preserve folder structure: get relative path from image_dir
            relative_path = img_path.relative_to(image_dir)

            # Create output path maintaining folder structure
            label_path = output_dir / relative_path.parent / f"{img_path.stem}.txt"
            label_path.parent.mkdir(parents=True, exist_ok=True)

            with open(label_path, 'w') as f:
                for det in detections:
                    # Use folder name as class if available, otherwise use detected class
                    class_name = ingredient_name if use_folder_as_label else det["class"]

                    # Get class ID from mapping
                    if class_mapping and class_name in class_mapping:
                        class_id = class_mapping[class_name]
                    else:
                        class_id = 0

                    bbox = det["bbox"]
                    # YOLO format: class_id x_center y_center width height
                    f.write(f"{class_id} {bbox[0]:.6f} {bbox[1]:.6f} {bbox[2]:.6f} {bbox[3]:.6f}\n")
                    stats["total_boxes"] += 1

            stats["labeled_images"] += 1

        return stats

    def visualize_labels(
        self,
        image_path: str,
        label_path: str,
        class_names: List[str],
        output_path: Optional[str] = None
    ) -> np.ndarray:

        img = cv2.imread(image_path)
        height, width = img.shape[:2]

        if not os.path.exists(label_path):
            return img

        with open(label_path, 'r') as f:
            for line in f:
                parts = line.strip().split()

                if len(parts) < 5:
                    continue

                class_id = int(parts[0])
                x_center, y_center, w, h = map(float, parts[1:5])

                # Convert normalized coords to pixel coords
                x_center *= width
                y_center *= height
                w *= width
                h *= height

                x1 = int(x_center - w/2)
                y1 = int(y_center - h/2)
                x2 = int(x_center + w/2)
                y2 = int(y_center + h/2)

                # Draw box
                color = (0, 255, 0)
                cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

                # Draw label
                label = class_names[class_id] if class_id < len(class_names) else f"class_{class_id}"
                cv2.putText(img, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        if output_path:
            cv2.imwrite(output_path, img)

        return img


if __name__ == "__main__":
    # Download models first (optional)
    # labeler = Labeler(model_name="yolov8m.pt", confidence_threshold=0.5)
    labeler = Labeler(model_name="yolo11m.pt", confidence_threshold=0.5)

    # Auto-label a directory
    stats = labeler.label_batch(
        image_dir="dataset/imgs",
        output_dir="dataset/labels",
        class_mapping={
            "agar agar powder": 0,
            "alsa powder": 1,
            "annatto oil": 2,
            "bamboo shoot": 3,
            "banana": 4
        },
        use_folder_as_label=True
    )

    print(f"\nLabeling complete!")
    print(f"Total images: {stats['total_images']}")
    print(f"Labeled images: {stats['labeled_images']}")
    print(f"Total bounding boxes: {stats['total_boxes']}")
