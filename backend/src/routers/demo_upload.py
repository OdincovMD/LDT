"""
Простой аплоад демо-данных:
- принимает multipart UploadFile
- ограничивает размер (MAX_UPLOAD_BYTES)
- валидирует CSV-хедер: должны быть t,bpm,uc
- перезаписывает один фиксированный файл рядом с CSV_PATH
"""

import os
import csv as _csv
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

_MAX_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", "15000000"))

def _csv_base_path() -> Path:
    """Базовый файл, который использует симулятор (CSV_PATH или src/demo.csv)."""
    csv_path = os.getenv("CSV_PATH")
    if csv_path:
        return Path(csv_path).resolve()
    here = Path(__file__).resolve().parent.parent
    return (here / "demo.csv").resolve()

def _target_upload_path() -> Path:
    """
    Лежит рядом с CSV_PATH, но не затирает его: demo.user.csv
    """
    base = _csv_base_path()
    return base.with_name("demo.user.csv")

def _validate_csv_header(path: Path) -> None:
    """Проверить, что CSV читается и есть хотя бы одна строка, и колонки t,bpm,uc."""
    with path.open("r", newline="") as f:
        sample = f.read(4096)
        f.seek(0)
        try:
            dialect = _csv.Sniffer().sniff(sample, delimiters=",;\t ")
        except Exception:
            dialect = _csv.excel
        reader = _csv.DictReader(f, dialect=dialect)
        if not reader.fieldnames:
            raise ValueError("CSV: не удалось прочитать заголовок")
        cols = {str(c).strip().lower() for c in reader.fieldnames}
        need = {"t", "bpm", "uc"}
        if not need.issubset(cols):
            raise ValueError(f"CSV: требуются колонки {sorted(need)}, получены: {sorted(cols)}")
        try:
            next(reader)
        except StopIteration:
            raise ValueError("CSV: файл пустой")

@router.post("/upload")
async def upload_demo_csv(file: UploadFile = File(...)):
    """
    Кладёт файл как <dir(CSV_PATH)>/demo.user.csv
    - перезаписывает всегда;
    - размер ограничен MAX_UPLOAD_BYTES;
    - принимает только текстовые CSV ('.csv' не обязателен, важен формат).
    """
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Пустой файл")

    if len(content) > _MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Размер файла превышает лимит {_MAX_BYTES} байт"
        )

    target = _target_upload_path()
    target.parent.mkdir(parents=True, exist_ok=True)

    # Временная запись -> валидация -> перезапись целевого
    tmp_path = target.with_suffix(target.suffix + ".tmp")
    try:
        tmp_path.write_bytes(content)
        _validate_csv_header(tmp_path)
        # Перезаписываем целевой файл одним движением
        os.replace(str(tmp_path), str(target))
        return {"ok": True, "path": str(target)}
    except Exception as e:
        # Уберём временный файл, если не успели заменить
        try:
            if tmp_path.exists():
                tmp_path.unlink(missing_ok=True)
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=str(e))