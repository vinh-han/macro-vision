import random
from pathlib import Path
from typing import List, Optional, Tuple

import cv2
import numpy as np


class YOLOVisualizer:
    def __init__(
        self,
        dataset_dir: str = "dataset/ingredients_dataset",
        class_names_file: Optional[str] = None
    ):
        self.dataset_dir = Path(dataset_dir)
        self.class_names = self.load_class_names(class_names_file)

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
            print(f"Fialed to read {image_path}")
            return None

        h, w = img.shape[:2]

        # read labels
        if not label_path.exists():
            print(f"No label file for {image_path.name}")
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

        return img

    # Viz random samples from dataset
    def visualize_dataset(
        self,
        split: str = "train",
        num_samples: int = 5,
        save_output: bool = False,
        output_dir: str = "labeled_images"
    ):
        images_dir = self.dataset_dir / split / 'images'
        labels_dir = self.dataset_dir / split / 'labels'

        if not images_dir.exists():
            print(f"Images directory not found {images_dir}")
            return

        # get all image
        image_files = list(images_dir.glob("*.*"))

        if not image_files:
            print(f"No images found in {images_dir}")
            return

        sample_size = min(num_samples, len(image_files))
        sampled_images = random.sample(image_files, sample_size)

        print(f"\nVisualizing {sample_size} images from {split} set.")
        print("Press any key to see next image, 'q' to quit, 's' to save\n")

        if save_output:
            output_path = Path(output_dir)
            output_path.mkdir(exist_ok=True)

        for i, img_path in enumerate(sampled_images):
            label_path = labels_dir / f"{img_path.stem}.txt"

            # visualize
            viz_img = self.visualize_image(img_path, label_path)

            if viz_img is None:
                continue

            # Add info text
            info_text = f"{split.upper()} | {i+1}/{sample_size} | {img_path.name}"
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

            # check for cmmds
            if key == ord('q'):
                print("Quitting ...")
                break
            elif key == ord('s') and save_output:
                save_path = output_path / f"{split}_{i:03d}_{img_path.name}"
                cv2.imwrite(str(save_path), viz_img)
                print(f"Saved to {save_path}")

        cv2.destroyAllWindows()

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Visualize YOLO labels')
    parser.add_argument(
        '--dataset',
        default='dataset/ingredients_dataset',
        help='Dir to YOLO dataset'
    )
    parser.add_argument(
        '--split',
        default='train',
        choices=['train', 'val', 'test']
    )
    parser.add_argument(
        '--num-samples',
        type=int,
        default=5
    )
    parser.add_argument(
        '--save',
        action='store_true'
    )

    args = parser.parse_args()

    # create viz
    visualizer = YOLOVisualizer(dataset_dir=args.dataset)
    visualizer.visualize_dataset(
        split=args.split,
        num_samples=args.num_samples,
        save_output=args.save
    )

if __name__ == "__main__":
    main()
