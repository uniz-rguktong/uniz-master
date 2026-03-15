from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    JWT_SECURITY_KEY: str
    JWT_ALGORITHM: str

    DUMMY_TOKEN: str

    # ISOLATED CONFIG FOR ANALYTICS
    DB_USER: str
    DB_PASS: str
    DB_HOST: str 
    DB_PORT: str
    DB_NAME: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()