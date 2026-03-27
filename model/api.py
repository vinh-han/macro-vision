import tempfile
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

import cv2
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

from model.azure.detect import AzureLLMDetector
from model.clip.detect import CLIPDetector
from model.main.detect import Pipeline
from model.utils.logger import setup_logger
from model.yolo.detect import YOLODetector

logger = setup_logger(__name__, "api.log")


class Detection(BaseModel):
    ingredient: str
    confidence: Optional[float] = None
    box: Optional[List[float]] = None


class DetectResponse(BaseModel):
    detections: List[Detection]
    elapsed: float

detectors = {}

def _save_temp(upload: UploadFile) -> Path:
    suffix = Path(upload.filename or "img.jpg").suffix or ".jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(upload.file.read())
    tmp.close()
    return Path(tmp.name)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading detectors...")

    detectors["yolo"] = YOLODetector()
    logger.info("YOLO detector loaded")

    detectors["azure"] = AzureLLMDetector()
    logger.info("Azure LLM detector loaded")

    detectors["clip"] = CLIPDetector()
    logger.info("CLIP detector loaded")

    model_dir = Path(__file__).resolve().parent / "main" / "assets"
    detectors["main"] = Pipeline(model_dir=model_dir)
    logger.info("Main pipeline loaded")

    logger.info("All detectors ready")
    yield
    detectors.clear()


app = FastAPI(title="Model Detection API", lifespan=lifespan)


@app.post("/detect/yolo", response_model=DetectResponse)
async def detect_yolo(file: UploadFile = File(...)):
    path = _save_temp(file)
    try:
        t0 = time.time()
        detector = detectors["yolo"]
        raw = detector.predict_detailed(path)
        elapsed = time.time() - t0
        detections = [
            Detection(ingredient=d["class"], confidence=d["confidence"], box=d["box"])
            for d in raw
        ]
        logger.info(f"YOLO: {len(detections)} detections in {elapsed:.2f}s")
        return DetectResponse(detections=detections, elapsed=round(elapsed, 3))
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
        detector = detectors["azure"]
        ingredients = detector.predict_ingredients(path)
        elapsed = time.time() - t0
        detections = [
            Detection(ingredient=name)
            for name in ingredients
        ]
        logger.info(f"Azure: {len(detections)} detections in {elapsed:.2f}s")
        return DetectResponse(detections=detections, elapsed=round(elapsed, 3))
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
        detector = detectors["clip"]
        results = detector.predict_detailed(path)
        elapsed = time.time() - t0
        detections = [
            Detection(ingredient=name, confidence=round(score, 4))
            for name, score in results
        ]
        logger.info(f"CLIP: {len(detections)} detections in {elapsed:.2f}s")
        return DetectResponse(detections=detections, elapsed=round(elapsed, 3))
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
        pipeline = detectors["main"]
        img_bgr = cv2.imread(str(path))
        if img_bgr is None:
            raise HTTPException(status_code=400, detail="Could not read image")
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        raw = pipeline.predict(img_rgb)
        elapsed = time.time() - t0
        detections = []
        for d in raw:
            if "class" in d:
                detections.append(Detection(
                    ingredient=d["class"],
                    confidence=d["confidence"],
                    box=d["box"],
                ))
            else:
                top = d["predictions"][0]
                detections.append(Detection(
                    ingredient=top["class"],
                    confidence=top["confidence"],
                    box=d["box"],
                ))
        logger.info(f"Main: {len(detections)} detections in {elapsed:.2f}s")
        return DetectResponse(detections=detections, elapsed=round(elapsed, 3))
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
