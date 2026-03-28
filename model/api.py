import tempfile
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List

import cv2
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

from model.azure.detect import AzureLLMDetector
from model.clip.detect import CLIPDetector
from model.main.detect import Pipeline
from model.utils.logger import setup_logger
from model.yolo.detect import YOLODetector

logger = setup_logger(__name__, "api.log")


class DetectResponse(BaseModel):
    detections: List[str]

detectors = {}

def _save_temp(upload: UploadFile) -> Path:
    suffix = Path(upload.filename or "img.jpg").suffix or ".jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(upload.file.read())
    tmp.close()
    return Path(tmp.name)


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
            detectors["main"] = Pipeline(model_dir=model_dir)
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


@app.post("/detect/yolo", response_model=DetectResponse)
async def detect_yolo(file: UploadFile = File(...)):
    path = _save_temp(file)
    try:
        t0 = time.time()
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
        img_bgr = cv2.imread(str(path))
        if img_bgr is None:
            raise HTTPException(status_code=400, detail="Could not read image")
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
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
