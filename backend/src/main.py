"""
Точка входа FastAPI-приложения.
Регистрирует все роутеры: аутентификация, пользователи, пациенты, обследования,
потоковые данные и предсказания.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import auth, users, patients, cases, stream, predictions
from src.queries.orm import SyncOrm

app = FastAPI(title="Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    SyncOrm.create_tables()

# Подключение роутеров
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(patients.router, prefix="/patients", tags=["patients"])
app.include_router(cases.router, prefix="/cases", tags=["cases"])
app.include_router(stream.router, prefix="/stream", tags=["stream"])
app.include_router(predictions.router, prefix="/predictions", tags=["predictions"])

# Добавим корневой эндпоинт для проверки
@app.get("/")
def root():
    return {"message": "Backend is running!"}