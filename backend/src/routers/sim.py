"""
Роутер для управления симуляцией стриминга сигналов.
Используется для тестирования без реального датчика:
бекенд сам генерирует данные и вызывает ML.
"""

import asyncio
from typing import Optional
from fastapi import APIRouter, HTTPException
from src.schemas import SimStartReq, SimStopReq
from src.services.sim_worker import start_stream_worker

router = APIRouter()

_sim_tasks: dict[int, asyncio.Task] = {}


@router.post("/start")
async def sim_start(req: SimStartReq):
    """
    Старт симуляции стриминга для указанного case_id.
    Если задача уже идёт — вернём 409.
    """
    if req.case_id in _sim_tasks and not _sim_tasks[req.case_id].done():
        raise HTTPException(status_code=409, detail=f"Simulation already running for case {req.case_id}")

    task = asyncio.create_task(start_stream_worker(req.case_id, req.hz, req.H, req.stride_s))
    _sim_tasks[req.case_id] = task
    return {"status": "started", "case_id": req.case_id, "hz": req.hz, "H": req.H, "stride_s": req.stride_s}


@router.post("/stop")
async def sim_stop(req: SimStopReq):
    """
    Остановка симуляции для case_id.
    Если задачи нет — 404.
    """
    task: Optional[asyncio.Task] = _sim_tasks.get(req.case_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"No simulation for case {req.case_id}")

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    finally:
        _sim_tasks.pop(req.case_id, None)

    return {"status": "stopped", "case_id": req.case_id}


@router.get("/status")
async def sim_status():
    """
    Список активных симуляций и их состояние.
    """
    out = {}
    for cid, t in list(_sim_tasks.items()):
        out[cid] = "running" if not t.done() else f"done({t.exception()})" if t.exception() else "done"
        if t.done():
            _sim_tasks.pop(cid, None)
    return out
