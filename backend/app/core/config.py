from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql://triagem:triagem123@localhost:5432/triagem_saude"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"
    PROJECT_NAME: str = "FESF SUS — Item 02 (Docker + OAuth2)"
    API_V1_PREFIX: str = "/api/v1"


settings = Settings()
