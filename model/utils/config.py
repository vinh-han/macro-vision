from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LOGGING CONFIGS
    log_level: str = "INFO"
    log_dir: str = "logs"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()