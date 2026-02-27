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
        self.model, self.preprocess, self.tokenizer = self._load_model()
        self.text_embeds = self._build_or_load_text_embeddings()

        self.logger = setup_logger(__name__, "clip.log")

    def _load_ingredients(self) -> List[str]:
        with open(self.classes_path, "r") as f:
            return [line.strip() for line in f if line.strip()]

    def _load_model(self):
        print("Loading CLIP model...")
        model, preprocess, _ = open_clip.create_model_and_transforms(
            self.model_name,
            pretrained=self.pretrained
        )
        tokenizer = open_clip.get_tokenizer(self.model_name)
        model = model.to(self.device).eval()
        return model, preprocess, tokenizer

    def _build_or_load_text_embeddings(self) -> torch.Tensor:
        if self.embed_cache.exists():
            print("Loading cached text embeddings...")
            return torch.load(self.embed_cache, map_location=self.device)

        print("Building text embeddings (one-time)...")
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

    def predict_ingredients(self, image_path: Path, debug: bool = False) -> List[Tuple[str, float]]:
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

    def predict_folder(self, folder: Path) -> Dict[str, List[Tuple[str, float]]]:
        outputs = {}
        for img in folder.iterdir():
            if img.suffix.lower() in self.image_exts:
                outputs[img.name] = self.predict_ingredients(img)
        return outputs


if __name__ == "__main__":
    detector = CLIPDetector()

    img = Path(__file__).parent / "../c.jpg"
    preds = detector.predict_ingredients(
        img,
        # debug=True
    )

    print("\nDetected ingredients:")
    # for name, score in preds:
    #     print(f"{name:25s} {score:.3f}")

    print(preds)
