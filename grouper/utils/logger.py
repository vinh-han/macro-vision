import json
import logging
from datetime import datetime
from logging import Formatter, LogRecord
from logging.handlers import RotatingFileHandler
from pathlib import Path

from grouper.utils.config import settings

LOG_LEVEL = getattr(logging, settings.log_level.upper(), logging.INFO)
LOG_DIR = settings.log_dir

class JsonFormatter(Formatter):
    def format(self, record: LogRecord) -> str:
        log = {
            "timestamp": datetime.utcnow().isoformat(timespec="milliseconds") + "Z",
            "level": record.levelname,
            "service": record.name,
            "file": f"{record.filename}:{record.lineno}",
            "function": record.funcName,
            "message": record.getMessage(),
        }

        # Auto-merge extra={} fields
        metadata = {}
        for key, value in record.__dict__.items():
            if key not in ("filename", "levelname", "msg", "args", "exc_info", "exc_text", "stack_info", "lineno", "funcName"):
                if key not in log and not key.startswith("_"):
                    metadata[key] = value

        if metadata:
            log["metadata"] = metadata

        # Exceptions
        if record.exc_info:
            log["exception"] = self.formatException(record.exc_info)

        return json.dumps(log)

CONSOLE_FORMATTER = Formatter("[ %(levelname)s ] [ %(filename)s:%(lineno)d ] %(message)s")
FILE_FORMATTER = JsonFormatter()

def setup_logger(name: str, log_file: str) -> logging.Logger:
    log_file_path = Path(LOG_DIR) / log_file
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
