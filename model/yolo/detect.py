import argparse
import json
import time
from pathlib import Path
from typing import Dict, List, Optional

import cv2
import matplotlib
import matplotlib.patches as patches
import matplotlib.pyplot as plt
import numpy as np
from ultralytics import YOLO

from model.utils.logger import setup_logger


class YOLODetector:
    def __init__(
        self,
        model_path: Optional[Path] = Path(__file__).parent / "./assets/best.pt",
        classes_path: Optional[Path] = Path(__file__).parent / "../../assets/classes.txt",
        confidence_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        image_size: int = 640
    ):
        self.model_path = model_path
        self.classes_path = classes_path
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        self.image_size = image_size

        self.ingredients = self._load_ingredients()

        self.logger = setup_logger(__name__, "yolo.log")

        self.model = self._load_model()
        self.image_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

    def _load_ingredients(self) -> List[str]:
        with open(self.classes_path, "r", encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip()]

    def _load_model(self):
        self.logger.info(f"Loading YOLO model from {self.model_path}...")
        model = YOLO(str(self.model_path))
        return model

    def predict_ingredients(self, image_path: Path) -> List[str]:
        detections = self.predict_detailed(image_path)
        return sorted({d['class'] for d in detections})

    def predict_detailed(self, image_path: Path) -> List[dict]:
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

            detections = []

            for result in results:
                if result.boxes is not None and len(result.boxes) > 0:
                    for box in result.boxes:
                        class_id = int(box.cls[0])
                        conf = float(box.conf[0])
                        xyxy = box.xyxy[0].tolist()

                        if 0 <= class_id < len(self.ingredients):
                            detections.append({
                                'class': self.ingredients[class_id],
                                'confidence': round(conf, 4),
                                'box': [round(v, 1) for v in xyxy],
                            })

            elapsed_time = time.time() - start_time
            self.logger.info(f"YOLO detected {len(detections)} ingredients in {image_path} (took {elapsed_time:.2f}s)")
            return detections

        except Exception as e:
            self.logger.error(f"Error analyzing image {image_path}: {e}")
            return []

    def predict_folder(self, folder: Path) -> Dict[str, List[str]]:
        outputs = {}
        for img in folder.iterdir():
            if img.suffix.lower() in self.image_exts:
                outputs[img.name] = self.predict_ingredients(img)
        return outputs


def visualise_and_save(img_rgb, detections, out_path):
    matplotlib.use('Agg')

    fig, ax = plt.subplots(figsize=(12, 9))
    ax.imshow(img_rgb)
    colors = plt.cm.tab20.colors

    for i, det in enumerate(detections):
        x1, y1, x2, y2 = det['box']
        color = colors[i % len(colors)]
        label, conf = det['class'], det['confidence']
        ax.add_patch(patches.Rectangle(
            (x1, y1), x2 - x1, y2 - y1,
            linewidth=2, edgecolor=color, facecolor='none'
        ))
        ax.text(
            x1, max(y1 - 4, 0),
            f'{label} {conf:.2f}',
            color='white', fontsize=8, fontweight='bold',
            bbox=dict(facecolor=color, alpha=0.7, pad=1),
        )

    ax.set_title(f'{len(detections)} ingredients detected')
    ax.axis('off')
    plt.tight_layout()
    plt.savefig(out_path, dpi=150, bbox_inches='tight')
    plt.close()

    print(f'Saved: {out_path}')


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        '--image',
        required=True,
        type=Path,
        help='Image file or directory of images'
    )
    parser.add_argument(
        '--model_path',
        type=Path,
        default=Path(Path(__file__).parent / "./assets/best.pt"),
        help='Path to model .pt file'
    )
    parser.add_argument(
        '--classes_path',
        type=Path,
        default=Path(Path(__file__).parent / "../../assets/classes.txt"),
        help='Path to classes text file'
    )
    parser.add_argument(
        '--confidence_threshold',
        type=float,
        default=0.25,
        help='Confidence Threshold (default: 0.25)'
    )
    parser.add_argument(
        '--iou_threshold',
        type=float,
        default=0.45,
        help='IoU Threshold (default: 0.45)'
    )
    parser.add_argument(
        '--image_size',
        type=int,
        default=640,
        help='YOLO detection image size (default: 640)'
    )
    parser.add_argument(
        '--output',
        type=Path,
        default=None,
        help='Save JSON results to this file'
    )
    parser.add_argument(
        '--visualise',
        action='store_true',
        help='Save visualised output images'
    )
    parser.add_argument(
        '--vis_dir',
        type=Path,
        default=Path('./vis_out'),
        help='Visualized output images directory'
    )

    args = parser.parse_args()

    detector = YOLODetector(
        model_path=args.model_path,
        classes_path=args.classes_path,
        confidence_threshold=args.confidence_threshold,
        iou_threshold=args.iou_threshold,
        image_size=args.image_size,
    )

    if args.visualise:
        args.vis_dir.mkdir(parents=True, exist_ok=True)

    if args.image.is_dir():
        exts = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
        img_paths = sorted(p for p in args.image.iterdir() if p.suffix.lower() in exts)
    else:
        img_paths = [args.image]

    print(f'\nRunning on {len(img_paths)} image(s)...\n')

    all_results = {}
    for path in img_paths:
        t0 = time.time()

        detections = detector.predict_detailed(path)
        elapsed = time.time() - t0

        print(f'{path.name}  [{elapsed:.1f}s]  {len(detections)} detections')
        for d in detections:
            print(f'  {d["class"]:<30} conf={d["confidence"]:.3f}  box={d["box"]}')

        all_results[path.name] = detections

        if args.visualise and detections:
            img_bgr = cv2.imread(str(path))
            if img_bgr is not None:
                img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
                visualise_and_save(img_rgb, detections, args.vis_dir / f'{path.stem}_vis.jpg')

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(all_results, f, indent=2)
        print(f'\nResults saved to: {args.output}')


if __name__ == "__main__":
    main()
