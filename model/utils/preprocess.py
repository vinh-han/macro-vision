import cv2
import numpy as np

from model.utils.config import settings
from model.utils.logger import setup_logger

logger = setup_logger(__name__, "preprocess.log")


def validate_image(img: np.ndarray, file_size: int | None = None) -> np.ndarray:
    if img is None or img.size == 0:
        raise ValueError("Empty or unreadable image")

    max_file_bytes = settings.max_file_mb * 1024 * 1024
    max_long_side = settings.max_long_side

    if file_size is not None and file_size > max_file_bytes:
        raise ValueError(
            f"File too large: {file_size / 1024 / 1024:.1f} MB "
            f"(max {settings.max_file_mb} MB)"
        )

    h, w = img.shape[:2]

    if w > settings.max_width or h > settings.max_height:
        raise ValueError(
            f"Image dimensions too large: {w}x{h} "
            f"(max {settings.max_width}x{settings.max_height})"
        )

    if h < 10 or w < 10:
        raise ValueError(f"Image too small: {w}x{h}")

    # Ensure 3-channel uint8
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    elif img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

    if img.dtype != np.uint8:
        img = np.clip(img, 0, 255).astype(np.uint8)

    # Downscale to max_long_side if needed
    long_side = max(h, w)
    if long_side > max_long_side:
        scale = max_long_side / long_side
        new_w = int(w * scale)
        new_h = int(h * scale)
        logger.info(f"Resizing {w}x{h} -> {new_w}x{new_h} (scale {scale:.3f})")
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

    return img
