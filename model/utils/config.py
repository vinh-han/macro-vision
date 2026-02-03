from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LOGGING CONFIGS
    log_level: str = "INFO"
    log_dir: str = "logs"

    # AZURE OPENAI CONFIGS
    azure_openai_api_key: str = ""
    azure_openai_api_version: str = "2024-12-01-preview"
    azure_openai_endpoint: str = ""
    model_deployment_name: str = "extractor-mini"
    embedding_deployment_name: str = "embeddings"

    links_folder: str
    user_agent: str
    db_path: str
    recipe_db_name: str
    sessions_db_name: str
    token_expiration: str
    session_cookie_name: str

    frontend_port: int
    backend_port: int

    postgres_user: str
    postgres_password: str
    postgres_db: str

    ingredients_list_path: str = './assets/classes.txt'

    @property
    def ingredients_list(self) -> str:
        return Path(self.ingredients_list_path).read_text(encoding="utf-8").splitlines()

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
