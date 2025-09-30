"""
Модуль для подключения к PostgreSQL и работы с SQLAlchemy ORM.
Здесь создаются:
- sync_engine: движок для синхронных подключений,
- session_factory: фабрика сессий,
- BaseModel: абстрактный базовый класс для ORM-моделей,
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from src.config import settings

# Создание синхронного подключения к базе данных
sync_engine = create_engine(
    url=settings.DATABASE_URL_pg,  # URL подключения из конфигурации
    pool_size=5,                   # максимум 5 одновременных соединений
    max_overflow=10,               # доп. соединения при превышении лимита
    future=True,
)

# Создание фабрики сессий (по умолчанию без авто-коммита и авто-флаша)
session_factory = sessionmaker(
    bind=sync_engine,
    autoflush=False,
    autocommit=False,
)

# Декларативная база для ORM-моделей
Base = declarative_base()


class BaseModel(Base):
    """
    Базовый класс для всех ORM-моделей.
    Служит родителем для моделей в models.py.
    """
    __abstract__ = True  # таблица не будет создаваться для этого класса

    def __repr__(self) -> str:
        """
        Человекочитаемое представление ORM-объекта.
        Выводит все колонки таблицы в виде: <ClassName col1=val1,col2=val2,...>
        """
        cols = [f"{col}={getattr(self, col)}" for col in self.__table__.columns.keys()]
        return f"<{self.__class__.__name__} {', '.join(cols)}>"