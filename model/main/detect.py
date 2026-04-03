import argparse
import json
import math
import time
import warnings
from pathlib import Path
from typing import Dict, List, Optional

import cv2
import matplotlib
import matplotlib.patches as patches
import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.transforms as T
import yaml
from PIL import Image
from transformers import (GroundingDinoForObjectDetection,
                          GroundingDinoProcessor)

from model.utils.logger import setup_logger

MODEL_DIR = Path(__file__).resolve().parent / "assets"

class ArcFaceHead(nn.Module):
    def __init__(self, embed_dim, num_classes, margin=0.5, scale=64.0):
        super().__init__()
        self.scale = scale
        self.weight = nn.Parameter(torch.empty(num_classes, embed_dim))
        nn.init.xavier_uniform_(self.weight)
        self.cos_m = math.cos(margin)
        self.sin_m = math.sin(margin)
        self.th = math.cos(math.pi - margin)
        self.mm = math.sin(math.pi - margin) * margin

    def forward(self, embeddings, labels=None):
        w = F.normalize(self.weight, dim=1)
        cos_theta = F.linear(embeddings, w)

        if labels is None:
            return cos_theta * self.scale

        sin_theta = torch.sqrt(1.0 - cos_theta ** 2 + 1e-8).clamp(0, 1)
        cos_theta_m = cos_theta * self.cos_m - sin_theta * self.sin_m
        cos_theta_m = torch.where(cos_theta > self.th, cos_theta_m, cos_theta - self.mm)
        one_hot = torch.zeros_like(cos_theta)
        one_hot.scatter_(1, labels.unsqueeze(1), 1.0)
        return (one_hot * cos_theta_m + (1.0 - one_hot) * cos_theta) * self.scale


class DINOv2ArcFace(nn.Module):
    def __init__(self, backbone_name='dinov2_vits14', embed_dim=384,
                 num_classes=207, margin=0.5, scale=64.0):
        super().__init__()
        self.backbone = torch.hub.load(
            'facebookresearch/dinov2', backbone_name, pretrained=False
        )
        self.head = ArcFaceHead(embed_dim, num_classes, margin, scale)

    @torch.no_grad()
    def embed(self, x):
        feats = self.backbone.forward_features(x)['x_norm_clstoken']

        return F.normalize(feats, dim=1)


CLASSIFY_TRANSFORM = T.Compose([
    T.ToPILImage(),
    T.Resize((224, 224)),
    T.ToTensor(),
    T.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
])


def extract_crop(img_rgb, xyxy, pad=0.05):
    H, W = img_rgb.shape[:2]
    x1, y1, x2, y2 = xyxy
    bw, bh = x2 - x1, y2 - y1

    if bw < 2 or bh < 2:
        return None

    x1 = max(0, x1 - bw * pad)
    y1 = max(0, y1 - bh * pad)
    x2 = min(W, x2 + bw * pad)
    y2 = min(H, y2 + bh * pad)

    crop = img_rgb[int(y1):int(y2), int(x1):int(x2)]

    if crop.size == 0:
        return None

    ch, cw = crop.shape[:2]
    side = max(ch, cw)
    sq = np.zeros((side, side, 3), dtype=crop.dtype)
    sq[(side-ch)//2:(side-ch)//2+ch, (side-cw)//2:(side-cw)//2+cw] = crop

    return cv2.resize(sq, (224, 224))


def visualise_and_save(img_rgb, detections, out_path):
    matplotlib.use('Agg')

    fig, ax = plt.subplots(figsize=(12, 9))
    ax.imshow(img_rgb)
    colors = plt.cm.tab20.colors

    for i, det in enumerate(detections):
        x1, y1, x2, y2 = det['box']
        color = colors[i % len(colors)]
        if 'class' in det:
            label, conf = det['class'], det['confidence']
        else:
            label, conf = det['predictions'][0]['class'], det['predictions'][0]['confidence']
        ax.add_patch(patches.Rectangle(
            (x1, y1), x2-x1, y2-y1,
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


class Pipeline:
    def __init__(
            self,
            model_dir,
            gd_model_id='IDEA-Research/grounding-dino-tiny',
            gd_prompt='food ingredient .',
            gd_threshold=0.1,
            device=None
        ):
        device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.device = torch.device(device)
        self.gd_prompt = gd_prompt
        self.gd_threshold = gd_threshold
        self.logger = setup_logger(__name__, "main_pipeline.log")

        yaml_path = model_dir / 'data.yaml'
        proto_path = model_dir / 'prototypes.pt'
        weights_path = model_dir / 'arcface_final.pt'

        assert weights_path.exists(), f'arcface_final.pt not found in {model_dir}'
        assert proto_path.exists(), f'prototypes.pt not found in {model_dir}'

        if yaml_path.exists():
            with open(yaml_path) as f:
                self.class_names = yaml.safe_load(f)['names']
        else:
            proto_data = torch.load(
                proto_path,
                map_location='cpu'
            )

            if 'class_names' in proto_data:
                self.class_names = proto_data['class_names']
            else:
                raise FileNotFoundError(
                    f'data.yaml not found in {model_dir} and prototypes.pt has no class_names.'
                )

        num_classes = len(self.class_names)


        local_gd_path = Path(__file__).resolve().parent / 'assets' / 'grounding-dino-tiny'

        gd_source = str(local_gd_path) if local_gd_path.exists() else gd_model_id

        self.logger.info(f'Loading Grounding DINO: {gd_source} ...')
        self.gd_processor = GroundingDinoProcessor.from_pretrained(gd_source)

        self.gd_model = GroundingDinoForObjectDetection.from_pretrained(
            gd_source
        ).to(self.device)
        self.gd_model.eval()

        self.logger.info(f'Loading classifier ({num_classes} classes) ...')
        ckpt = torch.load(weights_path, map_location=self.device)

        self.classifier = DINOv2ArcFace(num_classes=num_classes).to(self.device)
        self.classifier.load_state_dict(ckpt['model_state'])
        self.classifier.eval()

        proto_data = torch.load(proto_path, map_location=self.device)
        self.prototypes = proto_data['prototypes'].to(self.device)

        self.logger.info(f'Pipeline ready.  Device: {self.device}')

    @torch.no_grad()
    def predict(self, img_rgb, top_k=1):
        H, W = img_rgb.shape[:2]
        pil_img = Image.fromarray(img_rgb)

        inputs = self.gd_processor(
            images=pil_img,
            text=self.gd_prompt,
            return_tensors='pt',
        ).to(self.device)

        outputs = self.gd_model(**inputs)
        results = self.gd_processor.post_process_grounded_object_detection(
            outputs,
            inputs.input_ids,
            threshold=self.gd_threshold,
            target_sizes=[(H, W)],
        )[0]

        proposal_boxes = results['boxes'].cpu().tolist()
        if not proposal_boxes:
            return []

        # Collect valid crops and their corresponding boxes
        crop_tensors = []
        valid_boxes = []
        for box in proposal_boxes:
            crop = extract_crop(img_rgb, box)
            if crop is None:
                continue
            crop_tensors.append(CLASSIFY_TRANSFORM(crop))
            valid_boxes.append(box)

        if not crop_tensors:
            return []

        # Batch classify all crops in a single forward pass
        batch = torch.stack(crop_tensors).to(self.device)
        embeddings = self.classifier.embed(batch)
        all_sims = torch.mm(embeddings, self.prototypes.T)
        del batch, embeddings

        detections = []
        for sims, box in zip(all_sims, valid_boxes):
            if top_k == 1:
                pred_idx = sims.argmax().item()
                confidence = torch.softmax(sims, dim=0)[pred_idx].item()
                detections.append({
                    'class': self.class_names[pred_idx],
                    'confidence': round(confidence, 4),
                    'box': [round(v, 1) for v in box],
                })
            else:
                topk = sims.topk(min(top_k, len(self.class_names)))
                probs = torch.softmax(sims, dim=0)
                detections.append({
                    'predictions': [
                        {'class': self.class_names[i.item()],
                         'confidence': round(probs[i].item(), 4)}
                        for i in topk.indices
                    ],
                    'box': [round(v, 1) for v in box],
                })

        return detections

    def predict_ingredients(self, image_path: Path) -> List[str]:
        img_bgr = cv2.imread(str(image_path))
        if img_bgr is None:
            self.logger.error(f"Could not read image: {image_path}")
            return []
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        detections = self.predict(img_rgb)
        return sorted({
            d['class'] if 'class' in d else d['predictions'][0]['class']
            for d in detections
        })

    def predict_folder(self, folder: Path) -> Dict[str, List[str]]:
        image_exts = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
        outputs = {}
        for img in folder.iterdir():
            if img.suffix.lower() in image_exts:
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
        '--model_dir',
        type=Path,
        default=MODEL_DIR,
        help='Folder containing arcface_final.pt, prototypes.pt, data.yaml (default: model/main/assets)'
    )
    parser.add_argument(
        '--gd_model',
        default='IDEA-Research/grounding-dino-tiny',
        help='Grounding DINO model ID (default: grounding-dino-tiny)'
    )
    parser.add_argument(
        '--prompt',
        default='food ingredient .',
        help='GD text prompt (default: "food ingredient .")'
    )
    parser.add_argument(
        '--threshold',
        type=float,
        default=0.1,
        help='GD confidence threshold (default: 0.1). '
    )
    parser.add_argument(
        '--top_k',
        type=int,
        default=1,
        help='Top-k class predictions per region (default: 1)'
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
    parser.add_argument(
        '--device',
        default=None,
        help="Device for running the pipeline ('cuda' or 'cpu', default: auto)"
    )

    args = parser.parse_args()

    pipeline = Pipeline(
        model_dir=args.model_dir,
        gd_model_id=args.gd_model,
        gd_prompt=args.prompt,
        gd_threshold=args.threshold,
        device=args.device,
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
        img_bgr = cv2.imread(str(path))
        if img_bgr is None:
            print(f'Could not read: {path}')
            continue
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        detections = pipeline.predict(img_rgb, top_k=args.top_k)
        elapsed = time.time() - t0

        print(f'{path.name}  [{elapsed:.1f}s]  {len(detections)} detections')
        for d in detections:
            if 'class' in d:
                print(f'  {d["class"]:<30} conf={d["confidence"]:.3f}  box={d["box"]}')
            else:
                top = d['predictions'][0]
                print(f'  {top["class"]:<30} conf={top["confidence"]:.3f}  box={d["box"]}')

        all_results[path.name] = detections

        if args.visualise and detections:
            visualise_and_save(img_rgb, detections, args.vis_dir / f'{path.stem}_vis.jpg')

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(all_results, f, indent=2)
        print(f'\nResults saved to: {args.output}')


if __name__ == '__main__':
    main()
