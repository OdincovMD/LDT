## Описание

Backend-сервис для работы с данными КТГ.
Функции:

* управление пользователями и пациентами,
* создание обследований (cases),
* приём потоковых данных (bpm, uc),
* вызов ML-сервиса и сохранение предсказаний,
* API для фронтенда.

Стек: FastAPI, PostgreSQL, SQLAlchemy, Pydantic, Docker.

---

## Структура проекта

```
backend/
├── Dockerfile
├── requirements.txt
├── src/
│   ├── main.py          # точка входа FastAPI
│   ├── config.py        # конфигурация из .env
│   ├── database.py      # подключение к БД
│   ├── models.py        # ORM-модели
│   ├── schemas.py       # Pydantic-схемы
│   ├── queries/   # операции ORM (SyncOrm, AsyncOrm)
│   ├── routers/         # роутеры FastAPI
│   └── services/        # фоновые сервисы (симуляция стрима)
└── .env
```

---

## Конфигурация

Файл `.env` в папке `backend`:

```env
DB_HOST=****
DB_PORT=****
DB_USER=****
DB_PASS=****
DB_NAME=****
ML_URL=http://ml:****/predict
```

---

## Основные эндпоинты

* `POST /auth/register` — регистрация пользователя
* `POST /auth/login` — логин
* `GET /users/{id}` — получить пользователя
* `POST /patients/?owner_id={id}` — создать пациента
* `POST /cases/` — создать обследование
* `POST /stream/data` — сохранить сигнал
* `POST /sim/start` — запуск симуляции
* `GET /predictions/by-case/{id}` — получить предсказания

Документация: `/docs`
