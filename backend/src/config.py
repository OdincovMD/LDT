"""
Модуль конфигурации проекта.
Использует pydantic-settings для загрузки настроек из переменных окружения (.env).
Содержит класс Settings с параметрами подключения к PostgreSQL.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Класс конфигурации приложения.
    Параметры берутся из переменных окружения или файла .env.
    """
    DB_HOST: str
    DB_PORT: int = 5432
    DB_USER: str
    DB_PASS: str
    DB_NAME: str

    @property
    def DATABASE_URL_pg(self) -> str:
        """
        Формирует строку подключения к PostgreSQL для SQLAlchemy.
        """
        return f"postgresql://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # Конфигурация pydantic-settings
    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
