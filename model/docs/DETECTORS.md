# Detection Methods

This document describes how each detection method in `model/` works, what models they use, and their tradeoffs.

All detectors share a common ingredient class list of 207 ingredients loaded from `assets/classes.txt`.

---

## **1. Main Pipeline (Grounding DINO + DINOv2 ArcFace)**

*Location:* `model/main/detect.py`

### *1.1. How it works*

A two-stage pipeline:

Stage 1 uses Grounding DINO (`IDEA-Research/grounding-dino-tiny`), a text-prompted open-vocabulary object detector. It receives the image and the text prompt `"food ingredient ."` and proposes bounding boxes for anything that looks like a food ingredient. This stage is class-agnostic; it just finds regions of interest.

Stage 2 takes each proposed region, crops it from the image (with 5% padding), resizes it to 224x224 with square letterboxing, and passes it through a DINOv2 ViT-S/14 backbone. The backbone produces a CLS token embedding which is L2-normalized. This embedding is compared against pre-computed class prototypes using cosine similarity. The class with the highest similarity (or top-k classes) is assigned to that crop. Confidence is derived from softmax over the similarity scores.

The DINOv2 backbone is fine-tuned with an ArcFace head (margin=0.5, scale=64.0) to produce discriminative embeddings for the 207 ingredient classes.

### *1.2. Model assets*

| File | Description |
|------|-------------|
| `model/main/assets/arcface_final.pt` | DINOv2 + ArcFace classifier weights |
| `model/main/assets/prototypes.pt` | Pre-computed class prototype embeddings |
| `model/main/assets/data.yaml` | Class name mapping (optional, falls back to prototypes.pt) |

### *1.3. Key parameters*

| Parameter | Default | Description |
|-----------|---------|-------------|
| `gd_model_id` | `IDEA-Research/grounding-dino-tiny` | Grounding DINO model |
| `gd_prompt` | `"food ingredient ."` | Text prompt for region proposals |
| `gd_threshold` | 0.1 | Minimum Grounding DINO confidence for proposals |
| `top_k` | 1 | Number of class predictions per region |

### *1.4. Output*

Per-region detections with ingredient name, confidence score, and bounding box coordinates `[x1, y1, x2, y2]`. When `top_k > 1`, each detection includes a ranked list of predictions.

### *1.5. Tradeoffs*

Most accurate method due to the two-stage approach. Grounding DINO generalizes well to unseen layouts. Slower than YOLO (two model forward passes per crop). Requires GPU for reasonable speed.


## **2. YOLO Detector**

*Location:* `model/yolo/detect.py`

### *2.1. How it works*

A single-stage object detection model. The image is resized to a fixed input size (default 640px) and passed through a YOLOv11 network in one forward pass. The model outputs bounding boxes, class IDs, and confidence scores directly.

Each detected box is mapped to an ingredient name via the class list. Non-maximum suppression (NMS) is applied using the IoU threshold to remove duplicate overlapping boxes.

### *2.2. Model assets*

| File | Description |
|------|-------------|
| `model/yolo/assets/best_transfer.pt` | Default weights (transfer-learned) |
| `model/yolo/assets/best_aug.pt` | Weights trained with augmentation |
| `model/yolo/assets/best.pt` | Base weights |
| `model/yolo/assets/best_v5.pt` | YOLOv5 weights |

### *2.3. Key parameters*

| Parameter | Default | Description |
|-----------|---------|-------------|
| `confidence_threshold` | 0.25 | Minimum confidence to keep a detection |
| `iou_threshold` | 0.45 | IoU threshold for NMS overlap removal |
| `image_size` | 640 | Input image resize dimension |

### *2.4. Output*

Per-object detections with ingredient name, confidence score, and bounding box coordinates `[x1, y1, x2, y2]`.

### *2.5. Tradeoffs*

Fast inference (single pass), provides spatial localization. Accuracy depends on training data coverage. Limited to ingredients seen during training.

---

## **3. CLIP Detector**

*Location:* `model/clip/detect.py`

### *3.1. How it works*

Zero-shot whole-image classification using OpenCLIP (ViT-L/14). No bounding boxes are produced.

At initialization, text embeddings are built for all 207 ingredients using three prompt templates per ingredient:
- `"a photo of {ingredient}"`
- `"a close-up photo of {ingredient}"`
- `"raw {ingredient} on a plate"`

The three embeddings per ingredient are averaged and L2-normalized, then cached to disk (`.clip_text_embeds.pt`) so this only runs once.

At inference, the image is encoded into the same embedding space. Cosine similarity is computed between the image embedding and all 207 text embeddings. Ingredients with similarity above the threshold are returned, sorted by score.

### *3.2. Model assets*

| File | Description |
|------|-------------|
| `model/clip/.clip_text_embeds.pt` | Cached text embeddings (auto-generated) |
| `model/clip/.cache/ViT-L-14.pt` | Cached CLIP model weights |
| `model/clip/.cache/ViT-L-14-336px.pt` | Cached CLIP model weights (336px variant) |

### *3.3. Key parameters*

| Parameter | Default | Description |
|-----------|---------|-------------|
| `model_name` | `ViT-L-14` | CLIP vision encoder architecture |
| `pretrained` | `laion2b_s32b_b82k` | Pretrained weights tag |
| `sim_threshold` | 0.25 | Minimum cosine similarity to include an ingredient |
| `top_k` | None | Limit to top-k results (no limit by default) |

### *3.4. Output*

A list of ingredient names with their similarity scores. No bounding boxes (the model sees the whole image at once).

### *3.5. Tradeoffs*

No training required on custom data; works zero-shot from the class list. Good at identifying ingredients that are visually prominent. Cannot localize ingredients spatially. Similarity scores are not true probabilities. Can struggle with small or occluded ingredients.

---

## **4. Azure LLM Detector**

*Location:* `model/azure/detect.py`

### *4.1. How it works*

Uses Azure OpenAI's vision-capable model (default deployment: `extractor-mini`) as a multimodal LLM. The image is base64-encoded and sent alongside a structured prompt that includes the full list of 207 ingredient names.

The prompt instructs the model to:
- Only identify ingredients that are clearly visible
- Be as specific as possible (e.g. "pork shoulder" over "pork")
- Return a JSON array of ingredient names
- Only use names from the provided class list

The response is parsed as JSON. Any returned ingredient that does not exactly match the class list is filtered out.

### *4.2. Configuration*

No local model files. Requires Azure OpenAI credentials in `model/.env`:

| Variable | Description |
|----------|-------------|
| `AZURE_OPENAI_API_KEY` | API key |
| `AZURE_OPENAI_ENDPOINT` | Resource endpoint URL |
| `AZURE_OPENAI_API_VERSION` | API version (default: `2024-12-01-preview`) |
| `MODEL_DEPLOYMENT_NAME` | Deployment name (default: `extractor-mini`) |

### *4.3. Output*

A flat list of ingredient names. No confidence scores or bounding boxes.

### *4.4. Tradeoffs*

Highest semantic understanding. Can reason about partially visible or ambiguous ingredients. No local GPU required (runs in the cloud). Slowest method due to network round-trip. Costs per API call. No spatial localization. Output quality depends on the deployed model.
