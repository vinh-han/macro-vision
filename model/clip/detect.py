import argparse
import json
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import open_clip
import torch
from PIL import Image

from model.utils.logger import setup_logger


class CLIPDetector:
    def __init__(
        self,
        model_name: str = "ViT-L-14",
        pretrained: str = "laion2b_s32b_b82k",
        classes_path: Optional[Path] = None,
        sim_threshold: float = 0.25,
        top_k: Optional[int] = None,
        device: Optional[str] = None
    ):
        self.model_name = model_name
        self.pretrained = pretrained
        self.sim_threshold = sim_threshold
        self.top_k = top_k
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        self.classes_path = classes_path or Path(__file__).parent / "../../assets/classes.txt"
        self.embed_cache = Path(__file__).parent / ".clip_text_embeds.pt"

        self.image_exts = {".jpg", ".jpeg", ".png", ".webp"}
        self.prompt_templates = [
            "a photo of {ingredient}",
            "a close-up photo of {ingredient}",
            "raw {ingredient} on a plate",
        ]

        self.ingredients = self._load_ingredients()

        self.logger = setup_logger(__name__, "clip.log")

        self.model, self.preprocess, self.tokenizer = self._load_model()
        self.text_embeds = self._build_or_load_text_embeddings()

    def _load_ingredients(self) -> List[str]:
        with open(self.classes_path, "r", encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip()]

    def _load_model(self):
        self.logger.info("Loading CLIP model...")
        model, preprocess, _ = open_clip.create_model_and_transforms(
            self.model_name,
            pretrained=self.pretrained
        )
        tokenizer = open_clip.get_tokenizer(self.model_name)
        model = model.to(self.device).eval()
        return model, preprocess, tokenizer

    def _build_or_load_text_embeddings(self) -> torch.Tensor:
        if self.embed_cache.exists():
            self.logger.info("Loading cached text embeddings...")
            return torch.load(self.embed_cache, map_location=self.device)

        self.logger.info("Building text embeddings (one-time)...")
        prompts = []
        for ingredient in self.ingredients:
            for tmpl in self.prompt_templates:
                prompts.append(tmpl.format(ingredient=ingredient))

        tokens = self.tokenizer(prompts).to(self.device)

        with torch.no_grad():
            text_embeds = self.model.encode_text(tokens)
            text_embeds /= text_embeds.norm(dim=-1, keepdim=True)

        text_embeds = text_embeds.view(
            len(self.ingredients),
            len(self.prompt_templates),
            -1
        )

        text_embeds = text_embeds.mean(dim=1)
        text_embeds /= text_embeds.norm(dim=-1, keepdim=True)

        torch.save(text_embeds.cpu(), self.embed_cache)
        return text_embeds.to(self.device)

    def predict_ingredients(self, image_path: Path) -> List[str]:
        return [name for name, _ in self.predict_detailed(image_path)]

    def predict_detailed(self, image_path: Path, debug: bool = False) -> List[Tuple[str, float]]:
        start_time = time.time()
        self.logger.info(f"CLIP analyzing image: {image_path}")

        image = Image.open(image_path).convert("RGB")
        image_input = self.preprocess(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            img_emb = self.model.encode_image(image_input)
            img_emb /= img_emb.norm(dim=-1, keepdim=True)
            sims = (img_emb @ self.text_embeds.T).squeeze(0)

        if debug:
            topk = torch.topk(sims, k=min(10, len(self.ingredients)))
            print("\n[DEBUG] Top-10 CLIP matches:")
            for idx, score in zip(topk.indices, topk.values):
                print(f"{self.ingredients[idx]:25s} {score.item():.3f}")

        sims = sims.cpu().numpy()

        results = [
            (self.ingredients[i], float(sims[i]))
            for i in range(len(self.ingredients))
            if sims[i] >= self.sim_threshold
        ]

        results.sort(key=lambda x: x[1], reverse=True)

        if self.top_k:
            results = results[:self.top_k]

        elapsed_time = time.time() - start_time
        self.logger.info(f"CLIP detected {len(results)} ingredients in {image_path} (took {elapsed_time:.2f}s)")

        return results

    def predict_folder(self, folder: Path) -> Dict[str, List[str]]:
        outputs = {}
        for img in folder.iterdir():
            if img.suffix.lower() in self.image_exts:
                outputs[img.name] = self.predict_ingredients(img)
        return outputs


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        '--image',
        required=True,
        type=Path,
        help='Image file or directory of images'
    )
    parser.add_argument(
        '--classes_path',
        type=Path,
        default=Path(__file__).resolve().parent.parent.parent / "assets" / "classes.txt",
        help='Path to classes text file'
    )
    parser.add_argument(
        '--model_name',
        type=str,
        default='ViT-L-14',
        help='CLIP model name (default: ViT-L-14)'
    )
    parser.add_argument(
        '--pretrained',
        type=str,
        default='laion2b_s32b_b82k',
        help='Pretrained weights tag (default: laion2b_s32b_b82k)'
    )
    parser.add_argument(
        '--sim_threshold',
        type=float,
        default=0.25,
        help='Similarity threshold (default: 0.25)'
    )
    parser.add_argument(
        '--top_k',
        type=int,
        default=None,
        help='Return only top-k results per image'
    )
    parser.add_argument(
        '--device',
        type=str,
        default=None,
        help='Device to run on (default: auto)'
    )
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Print top-10 similarity scores per image'
    )
    parser.add_argument(
        '--output',
        type=Path,
        default=None,
        help='Save JSON results to this file'
    )

    args = parser.parse_args()

    detector = CLIPDetector(
        model_name=args.model_name,
        pretrained=args.pretrained,
        classes_path=args.classes_path,
        sim_threshold=args.sim_threshold,
        top_k=args.top_k,
        device=args.device,
    )

    if args.image.is_dir():
        exts = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
        img_paths = sorted(p for p in args.image.iterdir() if p.suffix.lower() in exts)
    else:
        img_paths = [args.image]

    print(f'\nRunning on {len(img_paths)} image(s)...\n')

    all_results = {}
    for path in img_paths:
        t0 = time.time()
        detections = detector.predict_detailed(path, debug=args.debug)
        elapsed = time.time() - t0

        print(f'{path.name}  [{elapsed:.1f}s]  {len(detections)} detections')
        for name, score in detections:
            print(f'  {name:25s} {score:.3f}')

        all_results[path.name] = [
            {"class": name, "confidence": round(score, 4)}
            for name, score in detections
        ]

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(all_results, f, indent=2)
        print(f'\nResults saved to: {args.output}')


if __name__ == "__main__":
    main()
