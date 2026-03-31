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
  "detections": ["tomato", "onion", "garlic"]
}
```

| Field        | Type     | Description                          |
|--------------|----------|--------------------------------------|
| `detections` | string[] | List of detected ingredient names    |

---

## **2. Endpoints**

All endpoints accept `multipart/form-data` with a `file` field containing an image (JPEG, PNG, WebP, BMP).

### *2.1. POST /detect/main*

Two-stage pipeline: Grounding DINO proposes regions, DINOv2+ArcFace classifies each crop.

```bash
curl -X POST http://localhost:8001/detect/main \
  -F "file=@photo.jpg"
```

```json
{
  "detections": ["tomato", "garlic", "onion"]
}
```

### *2.2. POST /detect/yolo*

YOLO object detection.

```bash
curl -X POST http://localhost:8001/detect/yolo \
  -F "file=@photo.jpg"
```

```json
{
  "detections": ["garlic", "onion"]
}
```

### *2.3. POST /detect/clip*

CLIP zero-shot similarity matching (whole-image classification).

```bash
curl -X POST http://localhost:8001/detect/clip \
  -F "file=@photo.jpg"
```

```json
{
  "detections": ["rice noodle", "bean sprout"]
}
```

### *2.4. POST /detect/azure*

Azure OpenAI vision model (GPT).

```bash
curl -X POST http://localhost:8001/detect/azure \
  -F "file=@photo.jpg"
```

```json
{
  "detections": ["pork shoulder", "fish sauce"]
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
