from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    CLOUDFRONT_DOMAIN: str
    CLOUDFRONT_EXPIRE_TIME: int = 5
    KEY_PAIR_ID: str
    PRIVATE_KEY: str
    CORS_ALLOWED_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
