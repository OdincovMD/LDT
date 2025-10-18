# CTG Backend

Бэкенд для системы кардиотокографии (КТГ): учет пользователей/пациентов/кейсов, прием и трансляция сигналов (bpm, uc), интеграция с ML-сервисом, сохранение предсказаний и API для фронтенда/мостов.

---

## Ключевые возможности

* **REST API**: пользователи, пациенты, кейсы, сигналы, предсказания, загрузка демо-CSV, подготовка drop-файлов для моста.
* **WebSocket**: комнаты по `case_id`, широковещательная рассылка с автоподчисткой «мертвых» соединений.
* **Симуляция**: фоновой воркер читает CSV (`t,bpm,uc`), стримит точки в БД и периодически вызывает ML.
* **ML-интеграция**: разовый вызов `/predict` (внешний сервис по `ML_URL`), сохранение proba/label/alert и набора признаков.
* **Безопасность**: токены для HTTP/WS, проверка доступа в роутере, Drop-provision по валидному токену.
* **Готовность**: `/health` для оркестраторов и мониторинга.

---

## Структура проекта

```
.
├── Dockerfile
├── README.md
├── requirements.txt
└── src
    ├── config.py          # конфигурация (pydantic-settings/.env)
    ├── database.py        # инициализация SQLAlchemy (engine/session)
    ├── demo.csv           # базовый демо-набор для симулятора
    ├── main.py            # точка входа FastAPI (роутеры)
    ├── models.py          # ORM-модели (users, patients, cases, signals, predictions, ws_tokens, ...)
    ├── queries
    │   ├── async_orm.py   # асинхронные операции (вставка сигналов/окон/предсказаний)
    │   └── sync_orm.py    # синхронные операции (поиск токенов, выборки)
    ├── routers
    │   ├── auth.py        # регистрация/логин
    │   ├── bridge.py      # provision: drop-файлы для USB/WS-моста
    │   ├── cases.py       # CRUD кейсов
    │   ├── demo_upload.py # загрузка пользовательского demo.user.csv
    │   ├── health.py      # /health
    │   ├── patients.py    # CRUD пациентов
    │   ├── predictions.py # выдача предсказаний по кейсу
    │   ├── sim.py         # управление симулятором CSV (start/stop)
    │   ├── stream.py      # REST-приём данных стрима
    │   ├── users.py       # профиль/список пользователей
    │   ├── ws.py          # WebSocket /ws/case/{case_id}
    │   └── ws_token.py    # выпуск/ревокация WS-токенов
    ├── schemas.py         # Pydantic-схемы DTO
    ├── security.py        # извлечение/проверка токенов, current user
    └── services
        ├── sim_worker.py  # фон. воркер: CSV→БД + периодический ML-вызов
        └── ws_manager.py  # пул комнат WS (join/leave/broadcast)
```

---

## API

### Аутентификация

* `POST /auth/register` — регистрация
* `POST /auth/login` — логин, выдача токена

### Пользователи/пациенты/кейсы

* `GET /users/{id}` — получить пользователя
* `POST /patients?owner_id={id}` — создать пациента
* `POST /cases` — создать кейс, привязка к пациенту/владельцу
* `GET /cases/{id}` — получить кейс

### Потоки данных

* `POST /stream/data` — принять одну или батч точек (`timestamp,bpm,uc`)
* `GET /ws/case/{case_id}` (WS) — подписка на поток кейса

  ```
  ws(s)://<host>/ws/case/{case_id}?token=<WS_TOKEN>&H=<мин>&stride=<сек>
  ```

  Менеджер `ws_manager` отправляет всем участникам комнаты.

### Симуляция

* `POST /sim/start` — запустить воркер (параметры: `case_id`, `hz`, `H`, `stride_s`)
* `POST /sim/stop` — остановить воркер
* Воркер читает `CSV_PATH` (или рядом `demo.user.csv`, если загружен через `/demo_upload`) и каждые `stride_s` секунд дергает ML при наличии окна 300 с.

### Предсказания

* `GET /predictions/by-case/{case_id}?limit=N` — последние N записей (proba/label/alert/фичи).
* Сохранение выполняется из симулятора/обработчика ML-ответа.

### Drop-provision для моста

* `POST /provision/ws` — формирует JSON в `/bridge_drop/bridge-{case_id}-<ts>.json`:

  ```json
  {
    "created_at": "...Z",
    "mode": "ws",
    "ws_url": "ws://<host>/ws/case/{id}?token=...&H=5&stride=15",
    "user_id": 1,
    "case_id": 17,
    "token": "...",
    "H": 5,
    "stride": 15
  }
  ```

  Возвращает `{ filename, path_in_container, ws_url }`.

### Здоровье

* `GET /health` → `{"status":"ok","service":"backend"}`

Полные схемы и примеры — в Swagger `/docs`.

---

## Данные и форматы

### CSV (для симуляции)

`demo.csv` / `demo.user.csv`:

```
t,bpm,uc
0,142,10
1,143,12
...
```

* `t` — секунды от старта (float/int, монотонно),
* `bpm` — уд/мин, `uc` — условные единицы (0–100).

### WebSocket сообщения

Сервер шлет JSON-объекты точек/агрегатов; клиенты отправляют только команду на подключение (в URL). «Мертвые» соединения вычищаются при рассылке.

---

## Внутренняя логика

* **Окно ML**: 300 секунд.
* **Шаг инференса**: `stride_s` (сек), настраивается при запуске симуляции и/или в URL WS (для клиента).
* **Горизонт**: `H` (мин).
* **Сохранение**: предсказания и ключевые признаки отправляются в БД через `AsyncOrm`.
* **Токены**: проверяются в роутере; WS-токен должен соответствовать паре `(user_id, case_id)` в БД.