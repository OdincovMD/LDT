# Руководство пользователя (Deploy & Использование)

## 1) Что понадобится

* **Docker** и **Docker Compose** (актуальные версии).
* Свободные порты:

  * **Dev**: фронтенд **5173**, общий вход через **Nginx 90** (проксирует API и фронт).
  * **Prod (опц.)**: **80/443** для публичного домена.
* Доступ в интернет для первой сборки образов.

---

## 2) Конфигурация окружения

Создайте **`.env`** в корне проекта:

```env
# nginx
HOST=localhost
NGINX_PORT=90

# frontend
FRONTEND_PORT=5173

# backend
BACKEND_PORT=9000

# db
DB_HOST=postgres
DB_PORT=5432
DB_USER=hardbox
DB_PASS=supersecret
DB_NAME=hardbox

# ML
ML_PORT=8000
ML_URL=http://ml:8000/predict

# sim worker
CSV_PATH=/app/src/demo.csv
MAX_UPLOAD_BYTES=30000000
```

> При изменении портов/хостов — пересоберите/перезапустите контейнеры.

---

## 3) Запуск

В корне репозитория:

```bash
docker compose build      # первый запуск / после изменений
docker compose up -d      # поднять все сервисы
```

Проверка:

* Фронтенд (dev): **[http://localhost:5173/](http://localhost:5173/)**
* Общий вход через Nginx: **[http://localhost:90/](http://localhost:90/)**
* Логи Nginx: `docker compose logs nginx -f`

Остановка/перезапуск:

```bash
docker compose down
docker compose up -d
```

---

## 4) Первое знакомство (UI)

1. **Авторизация** — войдите или зарегистрируйтесь.
2. **Пациенты и кейсы** — создайте пациента → создайте кейс (контейнер данных).
3. **Dashboard кейса**:

   * Статус соединения - выбранный источник данных (датчик), выбранные параметры модели.
   * Графики **FHR (bpm)** и **UC** за **последние 5 минут**.
   * Кривая риска на горизонт `H` (обычно 5 мин), индикатор тревоги с гистерезисом.
   * Параметры, на которых работала модель в последнем окне.

---

## 5) Получение данных: сценарии

### Сценарий A — Демо/симуляция из CSV (1 Гц)

1. При необходимости загрузите свой CSV (`t,bpm,uc`) через UI (роут **POST `/api/demo/upload`** создаст `demo.user.csv` рядом с базовым).
2. Запустите симулятор (роут **POST `/api/sim/start`**).
3. Остановить (роут **POST `/api/sim/stop`**).

**Как это работает:** воркер читает `CSV_PATH` (или `demo.user.csv`), пишет точки в БД с реальными временными метками; по накоплении **300 с** вызывает `ML_URL` каждые `stride_s` секунд и сохраняет предсказания.

---

### Сценарий B — Живой датчик по WebSocket

1. Выпустите WS-токен для пары *(user_id, case_id)* (роут **POST `/api/ws-token/create`**):.

   В ответе будет токен/хэш (см. вашу реализацию).

2. Подключите датчик к:

   ```
   ws://localhost:90/ws/case/17?token=<WS_TOKEN>&H=5&stride=1
   ```

   * `H` — горизонт прогноза (мин),
   * `stride` — шаг инференса (сек).

3. Откройте Dashboard кейса — данные и предсказания пойдут в реальном времени.

---

### Сценарий C — USB-мост (drop-file provisioning)

1. Сформируйте drop-файл для моста (роут **POST `/api/bridge/provision/ws`**):
2. Скопируйте/укажите этот JSON мосту (утилита на целевой машине). Мост поднимет соединение на `ws_url` и начнёт ретранслировать данные.

---

## Имитация датчика

Вы можете подать поток в систему без реального оборудования:
A) через **WS-паблишер из CSV** (`csv_ws_publisher.py`),
B) через **USB→WS мост** (`usb_bridge.py`) с drop-файлом.

---

### A) CSV → WebSocket: `csv_ws_publisher.py`

**Назначение:** читает CSV `t,bpm,uc` и шлёт в WS сообщения ровно вида:

```json
{"t": <float>, "bpm": <float|null>, "uc": <float|null>}
```

**Требования**

* Python 3.9+
* `pip install websockets`

**CSV-формат**

```
t,bpm,uc
0,142,10
1,143,12
...
```

* `t` — секунды от старта (float/int, монотонно)
* Пустые значения допустимы: `""` → `null`

**Авторизация и URL**

* Токен только в query:
  `ws://<host>/ws/case/<CASE_ID>?token=<OPAQUE>[&H=...&stride=...]`

**Запуск:**

```bash
python csv_ws_publisher.py \
  --file ./data.csv \
  --url  ws://localhost:90/ws/case/17 \
  --token JZ770r5... \
  --hz 1 \
  --use-t \
  --loop
```

**Параметры:**

* `--file` — путь к CSV (обяз.)
* `--url` — WS до `/ws/case/<id>` (без `?token`)
* `--token` — opaque WS-токен
* `--hz` — частота (если не используете колонку `t`), по умолчанию 1 Гц
* `--use-t` — использовать интервалы из `t` (сек) вместо `--hz`
* `--loop` — повторять файл «по кругу»

**Поведение и логика:**

* Поддержка keep-alive (ping/pong), авто-реконнект с экспоненциальным backoff.
* При старте пробует прочитать приветствие от сервера (необязательно).

**Проверка:**

* Откройте Dashboard кейса — точки начнут отображаться в реальном времени.

**Типичные проблемы:**

* `401/403` — неверный токен/нет прав на `case_id`.
* «ступени» по времени — включите `--use-t` или выставьте корректный `--hz`.
* CSV-ошибки: убедитесь, что есть заголовки `t,bpm,uc`.

---

### B) USB → WebSocket мост: `usb_bridge.py`

**Назначение:** читает строки из последовательного порта и форвардит «как есть» в WebSocket (text-frames).

**Требования**

* Python 3.9+
* `pip install pyserial websocket-client`

**Drop-файл (provision):**

1. Сгенерируйте в бэкенде:

```bash
curl -X POST "http://localhost:90/api/bridge/provision/ws" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"case_id":17,"H":5,"stride":1,"name_hint":"usb"}'
```

Ответ: `filename`, `path_in_container`, `ws_url`. Файл вида:

```json
{
  "mode": "ws",
  "ws_url": "ws://host/ws/case/17?token=...&H=5&stride=1",
  "user_id": 1,
  "case_id": 17,
  "token": "...",
  "H": 5,
  "stride": 1
}
```

2. Поместите этот JSON в директорию моста (по умолчанию `/opt/ctg-bridge/drop`).

**Выбор порта (приоритет):**

```
CLI --port  →  ENV CTG_BRIDGE_PORT  →  <drop>/port.txt  →  поле "port" в JSON  →  авто-поиск
```

Если найдено несколько портов — мост напечатает список и будет ждать файл `port.txt` с именем порта (одной строкой), например:

```
/dev/ttyACM0
```

**Запуск:**

```bash
# linux/macOS
python usb_bridge.py --dir /opt/ctg-bridge/drop --port /dev/ttyACM0

# Windows
python usb_bridge.py --dir C:\ctg-bridge\drop --port COM4
```

Параметры:

* `--dir` — директория drop-файлов (по умолчанию `/opt/ctg-bridge/drop` или `$CTG_BRIDGE_DIR`)
* `--poll` — период опроса каталога, сек (по умолчанию 2.0)
* `--once` — запуститься по первому найденному файлу и завершиться после остановки
* `--port` — явный выбор порта (перекрывает все источники)

**Поведение и логика:**

* Следит за `bridge-*.json`. При появлении/изменении — мягко перезапускает сессию.
* Авто-реконнект USB/WS с backoff, нормализация переводов строк.
* Пересылает **любой** текст: CSV/NDJSON/строка с датчика.

**Подсказки по платформам:**

* **Linux**: `/dev/ttyACM*`, `/dev/ttyUSB*`, удобнее `by-id`: `/dev/serial/by-id/...`
* **macOS**: `/dev/cu.usb*` / `/dev/tty.usb*`
* **Windows**: `COM<n>`

**Типичные проблемы:**

* «Порты не найдены»: проверьте права (Linux: добавьте пользователя в `dialout`, перезапустите сессию).
* «WS закрывается»: проверьте `ws_url` в JSON и валидность токена; убедитесь, что Nginx проксирует WS.

---

### Проверка и наблюдение

* **Dashboard кейса** — основная визуальная верификация.
* Логи:

  ```bash
  docker compose logs backend -f
  docker compose logs nginx -f
  ```
* Разовый REST-инжест (для теста без WS/USB):

  ```bash
  curl -X POST "http://localhost:90/api/stream/data" \
    -H "Content-Type: application/json" \
    -d '{"case_id":17,"points":[
          {"timestamp":"2025-10-19T12:00:00Z","bpm":142,"uc":10},
          {"timestamp":"2025-10-19T12:00:01Z","bpm":143,"uc":12}
        ]}'
  ```

---

### Безопасность

* WS-токены **не** передаются в теле/заголовках, только `?token=...` в URL.
* Токены выпускаются/отзываются бэкендом для конкретной пары `(user_id, case_id)`.

## 6) Что происходит под капотом

* **Окно ML**: 300 секунд (5 мин) — фиксировано.
* **Инференс**: каждые `stride` секунд после появления полного окна; результат (proba/label/alert + features) сохраняется.
* **WS-комнаты**: все подписчики кейса получают широковещательно новые точки/события; «мертвые» сокеты чистятся автоматически.

---

## 7) Частые вопросы (FAQ)

**Нет данных на графиках**
— Проверьте выбранный кейс, индикатор соединения и запущен ли сценарий (A–С).

**Предсказаний нет**
— Убедитесь, что накопилось 300 с данных и ML доступен по `ML_URL`.

**WS отваливается**
— Проверьте валидность токена, URL-параметры `H/stride`, прокси/Nginx таймауты.

**Пороги/гистерезис**
— Используются значения из бэкенда; настройка в конфиге/ML-сервисе (ALERT_ON/OFF).

---

## 8) Обслуживание

```bash
docker compose logs -f          # логи
docker compose up -d            # обновление/перезапуск
docker compose down             # остановка
```

---

## 9) Полезные эндпоинты (сводка)

* `GET  /api/health` — статус бэкенда
* `POST /api/sim/start|stop` — симулятор CSV
* `POST /api/demo/upload` — загрузить `demo.user.csv`
* `POST /api/ws-token/issue|revoke` — токены WS
* `POST /api/bridge/provision/ws` — drop-file для моста
* `POST /api/stream/data` — приём точек
* `GET  /api/predictions/by-case/{id}?limit=N` — предсказания
* `GET  /api/ws/case/{id}` (WS) — реальное время (`token`, `H`, `stride` в query)

> Полные схемы — **Swagger** по адресу: `http://localhost:90/docs` (или напрямую на `BACKEND_PORT`).


* **Developer Guide** — эндпоинты, форматы, как эмулировать поток: [ссылка](../backend/README.md)
* **ML Guide** — как считаются признаки и валидируется модель: [решение](../ml/notebooks/solution.ipynb), [документация](../ml/README.md)