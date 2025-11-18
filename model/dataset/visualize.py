from pathlib import Path

from dataset.labeler import Labeler

labeler = Labeler(model_name="yolov8n.pt", confidence_threshold=0.3)

print("\n" + "="*50)
print("Visualizing labeled images...")
print("="*50)

image_dir = Path("dataset/imgs")
label_dir = Path("dataset/labels")
output_dir = Path("dataset/visualizations")

output_dir.mkdir(parents=True, exist_ok=True)

class_names = ["tomato", "onion", "garlic"]

# Collect all image files
all_images = []
all_images.extend(image_dir.glob("**/*.jpg"))
all_images.extend(image_dir.glob("**/*.png"))
all_images.extend(image_dir.glob("**/*.jpeg"))


for img_path in all_images:
    relative_path = img_path.relative_to(image_dir)
    label_path = label_dir / relative_path.parent / f"{img_path.stem}.txt"

    if label_path.exists():
        # Create output path
        output_path = output_dir / f"{relative_path.parent.name}_{img_path.stem}_labeled.jpg"

        # Visualize
        labeler.visualize_labels(
            str(img_path),
            str(label_path),
            class_names,
            str(output_path)
        )
        print(f"[ OK ] Saved visualization: {output_path}")
    else:
        print(f" Label not found for: {img_path}")

print(f"\nVisualization complete! Check {output_dir} for results.")