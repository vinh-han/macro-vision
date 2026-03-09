import random
from pathlib import Path
from typing import List, Optional, Tuple

import cv2
import numpy as np

from model.utils.logger import setup_logger


class YOLOVisualizer:
    def __init__(
        self,
        dataset_dir: str = "ingredients_dataset",
        class_names_file: Optional[str] = None
    ):
        dataset_path = Path(dataset_dir)
        if not dataset_path.is_absolute():
            dataset_path = Path(__file__).parent / dataset_path
        self.dataset_dir = dataset_path
        self.class_names = self.load_class_names(class_names_file)
        self.logger = setup_logger(__name__, "viz_labels.log")

        # colors for diff classes
        np.random.seed(42)
        self.colors = [
            tuple(map(int, np.random.randint(0, 255, 3)))
            for _ in range(len(self.class_names))
        ]

    # Load class names from data.yaml
    def load_class_names(self, class_names_file: Optional[str]) -> List[str]:
        yaml_path = self.dataset_dir / 'data.yaml'
        if yaml_path.exists():
            with open(yaml_path) as f:
                for line in f:
                    if line.startswith('names:'):
                        # extract list from yaml
                        import ast
                        names_str = line.split(':', 1)[1].strip()
                        return ast.literal_eval(names_str)

        return []

    # Convert yolo format to pixel coordinates
    def yolo_to_bounding_box(
        self,
        x_center: float,
        y_center: float,
        width: float,
        height: float,
        img_width: int,
        img_height: int
    ) -> Tuple[int, int, int, int]:

        x1 = int((x_center - width / 2) * img_width)
        y1 = int((y_center - height / 2) * img_height)
        x2 = int((x_center + width / 2) * img_width)
        y2 = int((y_center + height / 2) * img_height)

        return x1, y1, x2, y2

    # Viz labels on an image
    def visualize_image(
        self,
        image_path: Path,
        label_path: Path,
        window_name: str = "YOLO Labels"
    ) -> np.ndarray:

        # read image
        img = cv2.imread(str(image_path))
        if img is None:
            self.logger.error(f"Failed to read {image_path}")
            return None

        h, w = img.shape[:2]

        # read labels
        if not label_path.exists():
            self.logger.warning(f"No label file for {image_path.name}")
            return img

        with open(label_path) as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) < 5:
                    continue

                class_idx = int(parts[0])
                x_center, y_center, width, height = map(float, parts[1:5])

                # convert to pixel coord
                x1, y1, x2, y2 = self.yolo_to_bounding_box(x_center, y_center, width, height, w, h)

                # draw bounding box
                color = self.colors[class_idx % len(self.colors)]
                cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

                # add label text
                if class_idx < len(self.class_names):
                    label_text = self.class_names[class_idx]
                else:
                    label_text = f"Class {class_idx}"

                # bg for text
                (text_w, text_h), _ = cv2.getTextSize(
                    label_text, cv2.FONT_HERSHEY_COMPLEX, 0.6, 2
                )
                cv2.rectangle(
                    img,
                    (x1, y1 - text_h - 10),
                    (x1 + text_w, y1),
                    color,
                    -1
                )

                # text
                cv2.putText(
                    img,
                    label_text,
                    (x1, y1 - 5),
                    cv2.FONT_HERSHEY_COMPLEX,
                    0.6,
                    (255, 255, 255),
                    2
                )

                coord_text = f"x:{x_center:.3f} y:{y_center:.3f} w:{width:.3f} h:{height:.3f}"
                cv2.putText(
                    img,
                    coord_text,
                    (x1, y2 + 12),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.35,
                    color,
                    1
                )

        return img

    # Viz random samples from dataset
    def visualize_dataset(
        self,
        split: str = "train",
        num_samples: int = 5,
        save_output: bool = False,
        output_dir: str = "labeled_images",
        start_index: int = 0,
        randomize: bool = False
    ):
        images_dir = self.dataset_dir / split / 'images'
        labels_dir = self.dataset_dir / split / 'labels'

        if not images_dir.exists():
            self.logger.error(f"Images directory not found {images_dir}")
            return

        image_files = list(images_dir.glob("*.*"))

        if not image_files:
            self.logger.warning(f"No images found in {images_dir}")
            return

        if num_samples == -1:
            sampled_images = image_files
        else:
            sample_size = min(num_samples, len(image_files))
            if randomize:
                sampled_images = random.sample(image_files, sample_size)
            else:
                sampled_images = image_files[:sample_size]

        total_samples = len(sampled_images)
        start_index = max(0, min(start_index, total_samples - 1))
        self.logger.info(f"Visualizing {total_samples} images from {split} set.")
        self.logger.info(f"Starting from index {start_index}")
        self.logger.info("Press 'n' for next, 'p' for previous, 'q' to quit, 's' to save")

        if save_output:
            output_path = Path(__file__).parent / output_dir
            output_path.mkdir(exist_ok=True)

        i = start_index
        while i < total_samples:
            img_path = sampled_images[i]
            label_path = labels_dir / f"{img_path.stem}.txt"

            viz_img = self.visualize_image(img_path, label_path)

            if viz_img is None:
                i += 1
                continue

            info_text = f"{split.upper()} | {i+1}/{total_samples} | {img_path.name}"
            cv2.putText(
                viz_img,
                info_text,
                (10, 30),
                cv2.FONT_HERSHEY_COMPLEX,
                0.7,
                (0, 255, 0),
                2
            )

            cv2.imshow("YOLO Label Visualization", viz_img)
            key = cv2.waitKey(0)

            if key == ord('q'):
                self.logger.info("Quitting ...")
                break
            elif key == ord('s') and save_output:
                save_path = output_path / f"{split}_{i:03d}_{img_path.name}"
                cv2.imwrite(str(save_path), viz_img)
                self.logger.info(f"Saved to {save_path}")
            elif key == ord('p'):
                i = max(0, i - 1)
            elif key == ord('n') or key == 32 or key == 13:
                i += 1
            else:
                i += 1

        cv2.destroyAllWindows()

    def visualize_single_image(
        self,
        split: str,
        image_name: str,
        save_output: bool = False,
        output_dir: str = "labeled_images"
    ):
        images_dir = self.dataset_dir / split / 'images'
        labels_dir = self.dataset_dir / split / 'labels'

        img_path = images_dir / image_name
        if not img_path.exists():
            self.logger.error(f"Image not found: {img_path}")
            return

        label_path = labels_dir / f"{img_path.stem}.txt"
        viz_img = self.visualize_image(img_path, label_path)

        if viz_img is None:
            return

        info_text = f"{split.upper()} | {image_name}"
        cv2.putText(
            viz_img,
            info_text,
            (10, 30),
            cv2.FONT_HERSHEY_COMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

        cv2.imshow("YOLO Label Visualization", viz_img)
        self.logger.info("Press any key to close, 's' to save")
        key = cv2.waitKey(0)

        if key == ord('s') and save_output:
            output_path = Path(__file__).parent / output_dir
            output_path.mkdir(exist_ok=True)
            save_path = output_path / f"{split}_{image_name}"
            cv2.imwrite(str(save_path), viz_img)
            self.logger.info(f"Saved to {save_path}")

        cv2.destroyAllWindows()

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Visualize YOLO labels')
    parser.add_argument(
        '--dataset',
        default='ingredients_dataset',
        help='Dir to YOLO dataset'
    )
    parser.add_argument(
        '--split',
        default='train',
        # choices=['train', 'val', 'test']
    )
    parser.add_argument(
        '--num-samples',
        type=int,
        default=5,
        help='Number of samples to visualize (-1 for all images)'
    )
    parser.add_argument(
        '--start-index',
        type=int,
        default=0,
        help='Index to start visualization from'
    )
    parser.add_argument(
        '--random',
        action='store_true',
        help='Randomize image selection'
    )
    parser.add_argument(
        '--image',
        type=str,
        help='Specific image filename to visualize'
    )
    parser.add_argument(
        '--save',
        action='store_true'
    )

    args = parser.parse_args()

    visualizer = YOLOVisualizer(dataset_dir=args.dataset)

    if args.image:
        visualizer.visualize_single_image(
            split=args.split,
            image_name=args.image,
            save_output=args.save
        )
    else:
        visualizer.visualize_dataset(
            split=args.split,
            num_samples=args.num_samples,
            save_output=args.save,
            start_index=args.start_index,
            randomize=args.random
        )

if __name__ == "__main__":
    main()
