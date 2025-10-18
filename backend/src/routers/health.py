"""
Маршрут проверки здоровья сервиса.
Возвращает краткий статус для оркестраторов и мониторинга по GET /health.
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "backend"}