"""
Точка входа FastAPI-приложения.
Регистрирует все роутеры: аутентификация, пользователи, пациенты, обследования,
потоковые данные и предсказания, запуск симуляции.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import auth, users, patients, cases, stream, predictions, sim, ws, ws_token, bridge, demo_upload, health
from src.queries.sync_orm import SyncOrm

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

# AUTH (регистрация / логин):
#   POST   /auth/register        -> регистрация нового пользователя
#   POST   /auth/login           -> логин, получить access_token
#
# USERS (работа с пользователями):
#   GET    /users/{user_id}      -> получить данные пользователя по id
#
# PATIENTS (пациенты, принадлежат пользователю-врачу):
#   POST   /patients/            -> создать пациента (нужен owner_id)
#   GET    /patients/by-user/{owner_id} -> список пациентов для пользователя
#
# CASES (обследования пациента):
#   POST   /cases/               -> создать кейс (нужен patient_id)
#   GET    /cases/by-patient/{patient_id} -> список кейсов пациента
#
# STREAM (сырые данные от датчика):
#   POST   /stream/data          -> добавить одну секунду данных (bpm, uc)
#   GET    /stream/data/{case_id}?limit=300 -> последние N сигналов
#
# PREDICTIONS (результаты ML-модели):
#   POST   /predictions/         -> вручную добавить предсказание
#   GET    /predictions/by-case/{case_id} -> список предсказаний для кейса
#
# SIM (симуляция датчика, временная заглушка):
#   POST   /sim/start            -> старт симуляции (нужен case_id, hz)
#   POST   /sim/stop             -> стоп симуляции
#   GET    /sim/status           -> статус активных симуляций

# Подключение роутеров
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(patients.router, prefix="/patients", tags=["patients"])
app.include_router(cases.router, prefix="/cases", tags=["cases"])
app.include_router(stream.router, prefix="/stream", tags=["stream"])
app.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
app.include_router(sim.router, prefix="/sim", tags=["sim"])
app.include_router(ws.router, prefix="/ws", tags=["ws"])
app.include_router(ws_token.router, prefix="/ws-token", tags=["ws-token"])
app.include_router(bridge.router, prefix="/bridge", tags=["bridge"])
app.include_router(demo_upload.router, prefix="/demo", tags=["demo"])
app.include_router(health.router, tags=["health"])