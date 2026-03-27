# Model API

Base URL: `http://localhost:8001`

Interactive docs (Swagger UI) available at `/docs` when the server is running.

Requires:
- `model/.env` with Azure OpenAI credentials (see `model/.env.stub`).

- DINOv2 + ArcFace models placed in `model/main/assets/`
```
model/main/
│   detect.py
│   __init__.py
│
├───assets
│       arcface_final.pt
│       prototypes.pt
```

- YOLO model files placed in `model/yolo/assets/`
```
model/yolo/
│   detect.py
│   __init__.py
│
├───assets
│       best.pt
```

---

## **1. Response Format**

All `/detect/*` endpoints return the same shape:

```json
{
  "detections": [
    {
      "ingredient": "string",
      "confidence": 0.0,
      "box": [x1, y1, x2, y2]
    }
  ],
  "elapsed": 0.0
}
```

| Field                    | Type              | Description                                          |
|--------------------------|-------------------|------------------------------------------------------|
| `detections`             | array             | List of detected ingredients                         |
| `detections[].ingredient`| string            | Ingredient name from the class list                  |
| `detections[].confidence`| float \| null     | Model confidence score (null if not available)        |
| `detections[].box`       | [float] \| null   | Bounding box `[x1, y1, x2, y2]` (null if not available) |
| `elapsed`                | float             | Inference time in seconds                            |

Which fields are populated depends on the detector:

| Endpoint         | `ingredient` | `confidence` | `box`  |
|------------------|:------------:|:------------:|:------:|
| `/detect/yolo`   | yes          | yes          | yes    |
| `/detect/main`   | yes          | yes          | yes    |
| `/detect/clip`   | yes          | yes          | null   |
| `/detect/azure`  | yes          | null         | null   |

---

## **2. Endpoints**

All endpoints accept `multipart/form-data` with a `file` field containing an image (JPEG, PNG, WebP, BMP).

### *2.1. POST /detect/main*

Two-stage pipeline: Grounding DINO proposes regions, DINOv2+ArcFace classifies each crop.
Returns bounding boxes with class and confidence.

```bash
curl -X POST http://localhost:8001/detect/main \
  -F "file=@photo.jpg"
```

```json
{
  "detections": [
    {
      "ingredient": "tomato",
      "confidence": 0.9234,
      "box": [55.2, 30.0, 200.1, 180.5]
    }
  ],
  "elapsed": 1.205
}
```

### *2.2. POST /detect/yolo*

YOLO object detection. Returns per-object bounding boxes with class and confidence.

```bash
curl -X POST http://localhost:8001/detect/yolo \
  -F "file=@photo.jpg"
```

```json
{
  "detections": [
    {
      "ingredient": "garlic",
      "confidence": 0.8712,
      "box": [120.3, 45.1, 280.7, 190.4]
    },
    {
      "ingredient": "onion",
      "confidence": 0.7531,
      "box": [310.0, 60.2, 450.5, 210.8]
    }
  ],
  "elapsed": 0.342
}
```


### *2.3. POST /detect/clip*

CLIP zero-shot similarity matching. Returns ingredients above the similarity threshold.
No bounding boxes (whole-image classification).

```bash
curl -X POST http://localhost:8001/detect/clip \
  -F "file=@photo.jpg"
```

```json
{
  "detections": [
    {
      "ingredient": "rice noodle",
      "confidence": 0.3812,
      "box": null
    },
    {
      "ingredient": "bean sprout",
      "confidence": 0.2917,
      "box": null
    }
  ],
  "elapsed": 0.518
}
```

### *2.4. POST /detect/azure*

Azure OpenAI vision model (GPT). Returns ingredient names only (no confidence or boxes).

```bash
curl -X POST http://localhost:8001/detect/azure \
  -F "file=@photo.jpg"
```

```json
{
  "detections": [
    {
      "ingredient": "pork shoulder",
      "confidence": null,
      "box": null
    },
    {
      "ingredient": "fish sauce",
      "confidence": null,
      "box": null
    }
  ],
  "elapsed": 2.841
}
```

### *2.5. GET /health*

Health check. Returns loaded detector names.

```json
{
  "status": "ok",
  "detectors": ["yolo", "azure", "clip", "main"]
}
```

---

## **3. Error Responses**

All endpoints return the same error shape on failure:

`400 Bad Request`: image could not be read

```json
{ "detail": "Could not read image" }
```

`500 Internal Server Error`: detector failure

```json
{ "detail": "error message" }
```

---

## **4. Running**

### *4.1. Docker Compose*

```bash
docker compose up model_api
```

### *4.2. Local (from project root)*
First create a Python venv.

On Windows, run:
```sh
# Setup venv
python -m venv .venv

# Activate venv
.venv/Scripts/activate

python.exe -m pip install --upgrade pip
python.exe -m pip install -r requirements.txt
```

On Unix, run:
```sh
# Setup venv
python3 -m venv .venv

# Activate venv
source .venv/bin/activate

python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
```

Then run the FastAPI app:
```bash
uvicorn model.api:app --port 8001
```
