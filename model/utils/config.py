from pathlib import Path

from pydantic_settings import BaseSettings

# Resolve paths relative to the model/ package root, not CWD
_MODEL_ROOT = Path(__file__).resolve().parent.parent
_PROJECT_ROOT = _MODEL_ROOT.parent


class Settings(BaseSettings):
    # LOGGING CONFIGS
    log_level: str = "INFO"
    log_dir: str = str(_PROJECT_ROOT / "logs")

    # AZURE OPENAI CONFIGS
    azure_openai_api_key: str = ""
    azure_openai_api_version: str = "2024-12-01-preview"
    azure_openai_endpoint: str = ""
    model_deployment_name: str = "extractor-mini"
    embedding_deployment_name: str = "embeddings"

    ingredients_list_path: str = str(_PROJECT_ROOT / "assets" / "classes.txt")

    @property
    def ingredients_list(self) -> str:
        return Path(self.ingredients_list_path).read_text(encoding="utf-8").splitlines()

    class Config:
        env_file = str(_MODEL_ROOT / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
