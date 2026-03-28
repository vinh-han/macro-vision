import argparse
from pathlib import Path

import open_clip
import torch

PROMPT_TEMPLATES = [
    "a photo of {ingredient}",
    "a close-up photo of {ingredient}",
    "raw {ingredient} on a plate",
]

DEFAULT_CLASSES = Path(__file__).resolve().parent.parent.parent / "assets" / "classes.txt"
DEFAULT_OUT = Path(__file__).resolve().parent / ".clip_text_embeds.pt"


def build(classes_path: Path, out_path: Path, model_name: str, pretrained: str) -> None:
    ingredients = [l.strip() for l in classes_path.read_text().splitlines() if l.strip()]
    print(f"Loaded {len(ingredients)} ingredients from {classes_path}")

    print(f"Loading CLIP model {model_name} ({pretrained})...")
    model, _, _ = open_clip.create_model_and_transforms(model_name, pretrained=pretrained)
    tokenizer = open_clip.get_tokenizer(model_name)
    model.eval()

    prompts = [
        tmpl.format(ingredient=ing)
        for ing in ingredients
        for tmpl in PROMPT_TEMPLATES
    ]

    tokens = tokenizer(prompts)

    print("Encoding text embeddings...")
    with torch.no_grad():
        text_embeds = model.encode_text(tokens)
        text_embeds /= text_embeds.norm(dim=-1, keepdim=True)

    text_embeds = text_embeds.view(len(ingredients), len(PROMPT_TEMPLATES), -1)
    text_embeds = text_embeds.mean(dim=1)
    text_embeds /= text_embeds.norm(dim=-1, keepdim=True)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(text_embeds.cpu(), out_path)
    print(f"Saved embeddings ({text_embeds.shape}) -> {out_path}")

def main():
    parser = argparse.ArgumentParser(description="Pre-build CLIP text embeddings cache")
    parser.add_argument("--classes", type=Path, default=DEFAULT_CLASSES, help="Path to classes.txt")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Output .pt file")
    parser.add_argument("--model", default="ViT-L-14", help="CLIP model name")
    parser.add_argument("--pretrained", default="laion2b_s32b_b82k", help="Pretrained weights tag")
    args = parser.parse_args()

    build(args.classes, args.out, args.model, args.pretrained)

if __name__ == "__main__":
    main()
