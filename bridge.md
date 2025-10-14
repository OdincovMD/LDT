# USB → WS Bridge — документация

Лёгкий кроссплатформенный мост, который читает строки из **USB-последовательного порта** и пересылает их в **WebSocket**.
Работает по «дроп-файлам»: как только в папке появляется `bridge-*.json` от бэкенда — мост автоматически стартует с заданной конфигурацией.

---

## Содержание

* [Возможности](#возможности)
* [Требования](#требования)
* [Установка](#установка)

  * [Linux](#linux)
  * [macOS](#macos)
  * [Windows](#windows)
* [Как работает](#как-работает)
* [Формат drop-файла (JSON)](#формат-drop-файла-json)
* [Запуск](#запуск)
* [Выбор/автопоиск порта](#выборавтопоиск-порта)
* [Автозапуск](#автозапуск)

  * [Linux (systemd)](#linux-systemd)
  * [macOS (launchd)](#macos-launchd)
  * [Windows (Task Scheduler)](#windows-task-scheduler)
* [Диагностика и подсказки](#диагностика-и-подсказки)
* [Безопасность](#безопасность)
* [FAQ](#faq)

---

## Возможности

* Мониторит директорию (по умолчанию `/opt/ctg-bridge/drop`) на появление `bridge-*.json`.
* Поднимает «мост»: **Serial → WS**, построчно, «как есть» (CSV/NDJSON/любой текст).
* Автопоиск и выбор порта (с приоритетом указания пользователем).
* Переживает обрывы USB/WS: автоматический реконнект с экспоненциальной задержкой.
* При появлении нового `bridge-*.json` — мягко перезапускается с новыми параметрами.

---

## Требования

* Python **3.8+**.
* Две лёгкие зависимости:

  ```
  pyserial
  websocket-client
  ```

---

## Установка

### Linux

```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip
python3 -m pip install --user --upgrade pyserial websocket-client
```

### macOS

```bash
# Python 3 через Homebrew (если нужно)
brew install python
python3 -m pip install --user --upgrade pyserial websocket-client
```

### Windows

1. Установите Python 3.8+ с официального сайта (галочка «Add Python to PATH»).
2. В PowerShell:

   ```powershell
   py -m pip install --upgrade pyserial websocket-client
   ```

> Рекомендуется использовать `venv`, если вы изолируете окружение.

---

## Как работает

1. Бэкенд создаёт JSON-файл в директории дропа (по умолчанию `/opt/ctg-bridge/drop`).
2. `usb_bridge.py` замечает файл, читает `ws_url`, пытается выбрать **serial-порт** (по приоритету).
3. Читает строки из порта и отправляет их в WebSocket (text-frames).

---

## Формат drop-файла (JSON)

Создаётся бэкендом (пример):

```json
{
  "mode": "ws",
  "ws_url": "ws://host/ws/case/17?token=...&H=5&stride=1",
  "user_id": 1,
  "case_id": 17,
  "token": "...",
  "H": 5,
  "stride": 1,
  "port": "/dev/ttyACM0",   // опционально
  "baud": 115200,           // опционально (default 115200)
  "format": "auto"          // не используется мостом, только для информации
}
```

---

## Запуск

Сохраните `usb_bridge.py` и сделайте исполняемым (Linux/macOS):

```bash
chmod +x usb_bridge.py
```

Базовый запуск (директория дропа по умолчанию):

```bash
./usb_bridge.py --dir /opt/ctg-bridge/drop
```

Параметры:

* `--dir PATH` — папка, где появляются `bridge-*.json` (или env `CTG_BRIDGE_DIR`).
* `--poll SEC` — период опроса папки (по умолчанию `2.0`).
* `--once` — запуститься по первому найденному файлу и завершиться после остановки моста.
* `--port NAME` — явно указать порт (перекрывает любые другие источники).

---

## Выбор/автопоиск порта

Приоритет источников **порта**:

1. CLI: `--port /dev/ttyACM0`
2. Env: `CTG_BRIDGE_PORT=/dev/ttyACM0`
3. Файл: `<drop>/port.txt` (одна строка — имя порта)
4. Поле `port` в JSON
5. **Автопоиск** через `pyserial.tools.list_ports`:

   * Linux: сначала `/dev/serial/by-id/*`, затем `/dev/ttyACM*`, `/dev/ttyUSB*`
   * macOS: `/dev/cu.usb*`, `/dev/tty.usb*`
   * Windows: `COM*`

Если найден **один** реальный порт — берётся автоматически.
Если портов **несколько**, мост выведет список и будет ждать, пока вы укажете его в файле:

```bash
echo /dev/ttyACM0 > /opt/ctg-bridge/drop/port.txt
```

Подсмотреть доступные устройства:

```bash
python3 -m serial.tools.list_ports -v
```

---

## Автозапуск

### Linux (systemd)

Файл `/etc/systemd/system/ctg-usb-bridge.service`:

```ini
[Unit]
Description=CTG USB→WS Bridge
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=%i
Group=%i
Environment=CTG_BRIDGE_DIR=/opt/ctg-bridge/drop
ExecStart=/usr/bin/env python3 /usr/local/bin/usb_bridge.py --dir /opt/ctg-bridge/drop
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Включить:

```bash
sudo systemctl enable --now ctg-usb-bridge@$USER.service
journalctl -u ctg-usb-bridge@$USER -f
```

### macOS (launchd)

`~/Library/LaunchAgents/com.ctg.usbbridge.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
 "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
 <dict>
  <key>Label</key><string>com.ctg.usbbridge</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/env</string>
    <string>python3</string>
    <string>/usr/local/bin/usb_bridge.py</string>
    <string>--dir</string>
    <string>/opt/ctg-bridge/drop</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>CTG_BRIDGE_DIR</key><string>/opt/ctg-bridge/drop</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/ctg-usbbridge.out</string>
  <key>StandardErrorPath</key><string>/tmp/ctg-usbbridge.err</string>
 </dict>
</plist>
```

Загрузка:

```bash
launchctl load ~/Library/LaunchAgents/com.ctg.usbbridge.plist
launchctl start com.ctg.usbbridge
```

### Windows (Task Scheduler)

1. Открыть **Планировщик заданий** → «Создать задачу».
2. Триггер: «При входе в систему».
3. Действие:

   * Программа/скрипт: `py`
   * Аргументы: `C:\path\to\usb_bridge.py --dir C:\opt\ctg-bridge\drop`
4. Включить «Выполнять, даже если пользователь не вошёл…» при необходимости.

---

## Диагностика и подсказки

* **Нет порта `/dev/ttyACM*`/`/dev/ttyUSB*`?**
  Проверь подключение, права и логи ядра:

  ```bash
  dmesg | tail -n 30
  groups $USER       # должен быть в dialout
  sudo usermod -aG dialout $USER
  newgrp dialout
  ```

* **Вижу только `/dev/ttyS*`** — это, как правило, не USB-адаптеры. Жди появления `ttyACM*`/`ttyUSB*` или укажи порт явно.

* **WS обрывается**: мост сам переподключится; проверь, что `ws_url` корректный и бекенд доступен.

* **Несколько устройств**: создайте `<drop>/port.txt` с нужным именем порта.

* **Логи**: выводятся в stdout/stderr; при systemd — `journalctl -u ... -f`.

---

## Безопасность

* **`token` в `ws_url`** — это доступ к ingest. Берегите директорию дропа (права `700`) и файл (`600`).
* На Linux поместите дроп-папку в каталог, доступный только нужному пользователю (`chown`, `chmod`).
* По возможности используйте **wss://** (TLS) и короткоживущие токены.

---

## FAQ

**Можно ли без установки зависимостей?**
Нет, нужны `pyserial` (доступ к порту) и `websocket-client` (клиент WS). Оба пакета лёгкие.

**Что, если устройство говорит бинарным протоколом?**
Скрипт пересылает **строки**. Если нужен бинарь — придётся расширить логику (читать блоками и `ws.send_binary`).

**А если датчик выдаёт CSV «t,bpm,uc» раз в секунду?**
Отлично — строки улетят на WS «как есть». Остальное делает ваш бэкенд.

**Как протестировать без датчика?**
Укажите любой «фиктивный» порт — мост будет пытаться коннектиться и писать ретраи; WS-часть проверяйте отдельным клиентом.