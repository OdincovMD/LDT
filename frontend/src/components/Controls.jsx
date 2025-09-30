/**
 * @component Controls
 * @description Компонент управления подключением. Позволяет выбирать режим подключения (демо/WebSocket/SSE) и управлять подключением/отключением к источнику данных.
 */
// src/components/Controls.jsx
import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";

function Controls({
  connected,
  onConnect,
  onDisconnect,
  mode,
  setMode,
  availableModes = ["demo"], // по умолчанию доступен только демо
}) {
  const modeLabel = useMemo(() => {
    switch (mode) {
      case "demo":
        return "Демо";
      case "ws":
        return "WebSocket";
      case "sse":
        return "SSE";
      default:
        return "—";
    }
  }, [mode]);

  const isDemo = mode === "demo";
  const isAllowed = (m) => availableModes.includes(m);

  const handleModeChange = useCallback(
    (e) => {
      const next = e.target.value;
      // разрешаем переключаться только на разрешённые режимы
      if (isAllowed(next)) setMode?.(next);
    },
    [setMode, availableModes]
  );

  const handleConnect = useCallback(() => {
    if (!connected && isDemo) onConnect?.();
  }, [connected, isDemo, onConnect]);

  const handleDisconnect = useCallback(() => {
    if (connected && isDemo) onDisconnect?.();
  }, [connected, isDemo, onDisconnect]);

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
        <option value="ws" disabled={!isAllowed("ws")}>
          WebSocket (скоро)
        </option>
        <option value="sse" disabled={!isAllowed("sse")}>
          SSE (скоро)
        </option>
      </select>

      {!connected ? (
        <button
          onClick={handleConnect}
          disabled={!isDemo}
          className={`px-3 py-1 rounded text-sm text-white focus:outline-none focus:ring-2 ${
            isDemo
              ? "bg-green-600 hover:bg-green-700 focus:ring-green-400"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          aria-pressed="false"
          aria-label="Подключиться"
        >
          Подключить
        </button>
      ) : (
        <button
          onClick={handleDisconnect}
          disabled={!isDemo}
          className={`px-3 py-1 rounded text-sm text-white focus:outline-none focus:ring-2 ${
            isDemo
              ? "bg-red-600 hover:bg-red-700 focus:ring-red-400"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          aria-pressed="true"
          aria-label="Отключиться"
        >
          Отключить
        </button>
      )}

      <div className="flex items-center gap-2" aria-live="polite">
        <div
          className={`w-2 h-2 rounded-full ${
            isDemo ? (connected ? "bg-green-500" : "bg-red-500") : "bg-gray-400"
          }`}
          aria-hidden="true"
        />
        <span className="text-xs text-slate-600">
          {isDemo
            ? connected
              ? "Подключено (демо)"
              : "Отключено (демо)"
            : "Недоступно"}
        </span>
      </div>
    </div>
  );
}

Controls.propTypes = {
  connected: PropTypes.bool.isRequired,
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func,
  mode: PropTypes.oneOf(["demo", "ws", "sse"]).isRequired,
  setMode: PropTypes.func,
  availableModes: PropTypes.arrayOf(PropTypes.oneOf(["demo", "ws", "sse"])),
};

export default React.memo(Controls);
