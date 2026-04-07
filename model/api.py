import tempfile
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List

import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model.azure.detect import AzureLLMDetector
from model.clip.detect import CLIPDetector
from model.main.detect import Pipeline
from model.utils.config import settings
from model.utils.logger import setup_logger
from model.utils.preprocess import validate_image
from model.yolo.detect import YOLODetector

logger = setup_logger(__name__, "api.log")


class DetectResponse(BaseModel):
    detections: List[str]

detectors = {}

def _save_temp(upload: UploadFile) -> Path:
    suffix = Path(upload.filename or "img.jpg").suffix or ".jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    data = upload.file.read()

    max_bytes = settings.max_file_mb * 1024 * 1024
    if settings.preprocess and len(data) > max_bytes:
        tmp.close()
        Path(tmp.name).unlink(missing_ok=True)
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(data) / 1024 / 1024:.1f} MB, max {settings.max_file_mb} MB)",
        )

    tmp.write(data)
    tmp.close()
    return Path(tmp.name)


def _read_and_preprocess(path: Path) -> np.ndarray:
    """Read image from disk, validate, and normalize for inference."""
    img_bgr = cv2.imread(str(path))
    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Could not decode image")
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    if not settings.preprocess:
        return img_rgb
    file_size = path.stat().st_size
    try:
        return validate_image(img_rgb, file_size=file_size)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


def _get_detector(name: str):
    if name not in detectors:
        logger.info(f"Lazy-loading {name} detector...")
        if name == "yolo":
            detectors["yolo"] = YOLODetector()
        elif name == "azure":
            detectors["azure"] = AzureLLMDetector()
        elif name == "clip":
            detectors["clip"] = CLIPDetector()
        elif name == "main":
            model_dir = Path(__file__).resolve().parent / "main" / "assets"
            detectors["main"] = Pipeline(model_dir=model_dir, gd_threshold=settings.gd_threshold)
        logger.info(f"{name} detector loaded")
    return detectors[name]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading main pipeline...")
    _get_detector("main")
    logger.info("Main pipeline ready (other detectors will lazy-load on first request)")
    yield
    detectors.clear()


app = FastAPI(title="Model Detection API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://127.0.0.1",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/detect/yolo", response_model=DetectResponse)
async def detect_yolo(file: UploadFile = File(...)):
    path = _save_temp(file)
    try:
        t0 = time.time()
        # Validate and downscale — write back so YOLO reads the normalized image
        img_rgb = _read_and_preprocess(path)
        cv2.imwrite(str(path), cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
        detector = _get_detector("yolo")
        raw = detector.predict_detailed(path)
        detections = list(dict.fromkeys(d["class"] for d in raw))
        logger.info(f"YOLO: {len(detections)} detections in {time.time() - t0:.2f}s")
        return DetectResponse(detections=detections)
    except Exception as e:
        logger.error(f"YOLO error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        path.unlink(missing_ok=True)


@app.post("/detect/azure", response_model=DetectResponse)
async def detect_azure(file: UploadFile = File(...)):
    path = _save_temp(file)
    try:
        t0 = time.time()
        detector = _get_detector("azure")
        detections = detector.predict_ingredients(path)
        logger.info(f"Azure: {len(detections)} detections in {time.time() - t0:.2f}s")
        return DetectResponse(detections=detections)
    except Exception as e:
        logger.error(f"Azure error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        path.unlink(missing_ok=True)


@app.post("/detect/clip", response_model=DetectResponse)
async def detect_clip(file: UploadFile = File(...)):
    path = _save_temp(file)
    try:
        t0 = time.time()
        # Validate and downscale — write back so CLIP reads the normalized image
        img_rgb = _read_and_preprocess(path)
        cv2.imwrite(str(path), cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
        detector = _get_detector("clip")
        results = detector.predict_detailed(path)
        detections = list(dict.fromkeys(name for name, _ in results))
        logger.info(f"CLIP: {len(detections)} detections in {time.time() - t0:.2f}s")
        return DetectResponse(detections=detections)
    except Exception as e:
        logger.error(f"CLIP error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        path.unlink(missing_ok=True)


@app.post("/detect/main", response_model=DetectResponse)
async def detect_main(file: UploadFile = File(...)):
    path = _save_temp(file)
    try:
        t0 = time.time()
        pipeline = _get_detector("main")
        img_rgb = _read_and_preprocess(path)
        raw = pipeline.predict(img_rgb)
        detections = []
        for d in raw:
            if "class" in d:
                detections.append(d["class"])
            else:
                detections.append(d["predictions"][0]["class"])
        detections = list(dict.fromkeys(detections))
        logger.info(f"Main: {len(detections)} detections in {time.time() - t0:.2f}s")
        return DetectResponse(detections=detections)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Main pipeline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        path.unlink(missing_ok=True)


@app.get("/health")
async def health():
    return {"status": "ok", "detectors": list(detectors.keys())}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
