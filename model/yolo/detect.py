import time
from pathlib import Path
from typing import Dict, List, Optional

from ultralytics import YOLO

from model.utils.logger import setup_logger


class YOLODetector:
    def __init__(
        self,
        model_path: Optional[Path] = None,
        classes_path: Optional[Path] = None,
        confidence_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        image_size: int = 640
    ):
        self.model_path = model_path or Path(__file__).parent / "best.pt"
        self.classes_path = classes_path or Path(__file__).parent / "../../assets/classes.txt"
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        self.image_size = image_size

        self.ingredients = self._load_ingredients()
        self.model = self._load_model()

        self.logger = setup_logger(__name__, "yolo.log")
        self.image_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

    def _load_ingredients(self) -> List[str]:
        with open(self.classes_path, "r", encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip()]

    def _load_model(self):
        print(f"Loading YOLO model from {self.model_path}...")
        model = YOLO(str(self.model_path))
        return model

    def predict_ingredients(self, image_path: Path) -> List[str]:
        start_time = time.time()
        self.logger.info(f"YOLO analyzing image: {image_path}")

        try:
            results = self.model.predict(
                source=str(image_path),
                conf=self.confidence_threshold,
                iou=self.iou_threshold,
                imgsz=self.image_size,
                verbose=False
            )

            detected_classes = set()

            for result in results:
                if result.boxes is not None and len(result.boxes) > 0:
                    for box in result.boxes:
                        class_id = int(box.cls[0])

                        if 0 <= class_id < len(self.ingredients):
                            detected_classes.add(self.ingredients[class_id])

            detected_list = sorted(list(detected_classes))

            elapsed_time = time.time() - start_time
            self.logger.info(f"YOLO detected {len(detected_list)} ingredients in {image_path} (took {elapsed_time:.2f}s)")
            return detected_list

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
    detector = YOLODetector()

    img = Path(__file__).parent / "../c.jpg"

    if img.exists():
        preds = detector.predict_ingredients(img)

        print("\nDetected ingredients:")
        # for name in preds:
        #     print(f"  - {name}")
        print(preds)
    else:
        print(f"Test image not found: {img}")
