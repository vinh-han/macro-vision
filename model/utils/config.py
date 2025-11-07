from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LOGGING CONFIGS
    log_level: str = "INFO"
    log_dir: str = "logs"

    # AZURE OPENAI CONFIGS
    azure_openai_api_key: str
    azure_openai_api_version: str = "2024-12-01-preview"
    azure_openai_endpoint: str
    model_deployment_name: str = "extractor-mini"
    embedding_deployment_name: str = "embeddings"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()