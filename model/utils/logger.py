import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from utils.config import settings

LOG_LEVEL = getattr(logging, settings.log_level.upper(), logging.INFO)
FILE_FORMATTER = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
CONSOLE_FORMATTER = logging.Formatter("%(message)s")

def setup_logger(name: str, log_file: str) -> logging.Logger:
    log_file_path = Path(settings.log_dir) / log_file
    log_file_path.parent.mkdir(parents=True, exist_ok=True)
    log_file_path.touch(exist_ok=True)

    logger = logging.getLogger(name)
    logger.setLevel(LOG_LEVEL)
    logger.propagate = False

    if not logger.handlers:
        file_handler = RotatingFileHandler(
            log_file_path,
            maxBytes=5_000_000,
            backupCount=5,
            encoding="utf-8"
        )
        file_handler.setFormatter(FILE_FORMATTER)
        file_handler.setLevel(LOG_LEVEL)

        console_handler = logging.StreamHandler()
        console_handler.setFormatter(CONSOLE_FORMATTER)
        console_handler.setLevel(LOG_LEVEL)

        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

    return logger