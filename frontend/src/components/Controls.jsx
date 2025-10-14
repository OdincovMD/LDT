/**
 * @component Controls
 * @description Компонент управления подключением. Позволяет выбирать режим подключения (демо/WebSocket/USB) и управлять подключением/отключением к источнику данных.
 */
// src/components/Controls.jsx
import React, { useCallback, useMemo, useEffect } from "react";
import PropTypes from "prop-types";

function Controls({
  connected,
  onConnect,
  onDisconnect,
  mode,
  setMode,
  availableModes = ["demo","ws","usb"],
  canConnect = true,
  connectLocked = false   // запрет ЛЮБОГО подключения после сохранения
}) {
  const modeLabel = useMemo(() => {
    switch (mode) {
      case "demo":
        return "Демо";
      case "ws":
        return "WebSocket";
      case "usb":
        return "USB";
      default:
        return "—";
    }
  }, [mode]);

  const isDemo = mode === "demo";
  const isWs = mode === "ws";
  const isUsb = mode === "usb";
  const isActive = isDemo || isWs || isUsb; // режимы, где есть кнопки подключения
  const isAllowed = (m) => availableModes.includes(m); // выбор режима разрешён

  useEffect(() => {
    if (connectLocked && connected) onDisconnect?.();
  }, [connectLocked, connected, onDisconnect]);

  const handleModeChange = useCallback(
    (e) => {
      const next = e.target.value;
      if (!isAllowed(next)) return;
      setMode?.(next);          // только смена режима, без автоконнекта/дисконнекта
    },
    [setMode, availableModes]
  );

  const handleConnect = useCallback(() => {
    if (!connected && isActive && !connectLocked) onConnect?.();
  }, [connected, isActive, connectLocked, onConnect]);

  const handleDisconnect = useCallback(() => {
    if (connected && isActive) onDisconnect?.();
  }, [connected, isActive, onDisconnect]);

  return (
    <div className="flex items-center gap-3">
      <label className="sr-only" htmlFor="mode-select">
        Режим подключения
      </label>
      <select
        id="mode-select"
        value={mode}
        onChange={handleModeChange}
        className="bg-white border border-gray-300 rounded px-3 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label={`Режим: ${modeLabel}`}
      >
        <option value="demo" disabled={!isAllowed("demo")}>
          Демо
        </option>
        <option
          value="ws"
          disabled={!isAllowed("ws")}
          title={connectLocked ? "WS недоступен: кейс сохранён" : ""}
        >
          WebSocket
        </option>
        <option
          value="usb"
          disabled={!isAllowed("usb")}
          title={connectLocked ? "USB недоступен: кейс сохранён" : ""}
        >USB</option>
      </select>

      {isActive && !connected ? (
        <button
          onClick={handleConnect}
          disabled={!(isActive && canConnect) || connectLocked}
          className={`px-3 py-1 rounded text-sm text-white focus:outline-none focus:ring-2 ${
            isActive && canConnect && !connectLocked
              ? "bg-green-600 hover:bg-green-700 focus:ring-green-400"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          aria-pressed="false"
          aria-label="Подключиться"
          title={connectLocked ? "Подключение недоступно: кейс сохранён" : ""}
        >
          Подключить
        </button>
      ) : isActive ? (
        <button
          onClick={handleDisconnect}
          disabled={!isActive}
          className={`px-3 py-1 rounded text-sm text-white focus:outline-none focus:ring-2 ${
            isActive
              ? "bg-red-600 hover:bg-red-700 focus:ring-red-400"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          aria-pressed="true"
          aria-label="Отключиться"
        >
          Отключить
        </button>
      ) : null}

      <div className="flex items-center gap-2" aria-live="polite">
        <div
          className={`w-2 h-2 rounded-full ${
            isActive ? (connected ? "bg-green-500" : "bg-red-500") : "bg-gray-400"
          }`}
          aria-hidden="true"
        />
        <span className="text-xs text-slate-600">
          {
            isDemo
              ? connected
                ? "Подключено (демо)"
                : connectLocked
                  ? "Недоступно: кейс сохранён"
                  : canConnect
                    ? "Отключено (демо)"
                    : "Недоступно: выберите кейс"
              : isWs
                ? connected
                  ? "Подключено (ws)"
                  : connectLocked
                    ? "Недоступно: кейс сохранён"
                    : canConnect
                      ? "Отключено (ws)"
                      : "Недоступно: выберите кейс"
                : isUsb
                  ? connected
                    ? "Подключено (usb)"
                    : connectLocked ? "Недоступно: кейс сохранён" : (canConnect ? "Отключено (usb)" : "Недоступно: выберите кейс")
                  : "Недоступно"
          }
        </span>
      </div>
    </div>
  );
}

Controls.propTypes = {
  connected: PropTypes.bool.isRequired,
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func,
  mode: PropTypes.oneOf(["demo", "ws", "usb"]).isRequired,
  setMode: PropTypes.func,
  availableModes: PropTypes.arrayOf(PropTypes.oneOf(["demo", "ws", "usb"])),
  canConnect: PropTypes.bool,
  connectLocked: PropTypes.bool
};

export default React.memo(Controls);
