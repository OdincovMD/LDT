// src/components/Controls.jsx
import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";

function Controls({ connected, onConnect, onDisconnect, onClear, mode, setMode }) {
  const modeLabel = useMemo(() => {
    switch (mode) {
      case "demo": return "Демо";
      case "ws":   return "WebSocket";
      case "sse":  return "SSE";
      default:     return "—";
    }
  }, [mode]);

  const handleModeChange = useCallback((e) => {
    setMode?.(e.target.value);
  }, [setMode]);

  const handleConnect = useCallback(() => {
    if (!connected) onConnect?.();
  }, [connected, onConnect]);

  const handleDisconnect = useCallback(() => {
    if (connected) onDisconnect?.();
  }, [connected, onDisconnect]);

  const handleClear = useCallback(() => {
    onClear?.();
  }, [onClear]);

  return (
    <div className="flex items-center gap-3">
      <label className="sr-only" htmlFor="mode-select">Режим подключения</label>
      <select
        id="mode-select"
        value={mode}
        onChange={handleModeChange}
        className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm text-white"
        aria-label={`Режим: ${modeLabel}`}
      >
        <option value="demo">Демо</option>
        <option value="ws">WebSocket</option>
        <option value="sse">SSE</option>
      </select>

      {!connected ? (
        <button
          onClick={handleConnect}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400"
          aria-pressed="false"
          aria-label="Подключиться"
        >
          Подключить
        </button>
      ) : (
        <button
          onClick={handleDisconnect}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-pressed="true"
          aria-label="Отключиться"
        >
          Отключить
        </button>
      )}

      <button
        onClick={handleClear}
        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Очистить данные"
      >
        Очистить
      </button>

      <div className="flex items-center gap-2" aria-live="polite">
        <div
          className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
          aria-hidden="true"
        />
        <span className="text-xs text-white/90">
          {connected ? "Подключено" : "Отключено"}
        </span>
      </div>
    </div>
  );
}

Controls.propTypes = {
  connected:    PropTypes.bool.isRequired,
  onConnect:    PropTypes.func,
  onDisconnect: PropTypes.func,
  onClear:      PropTypes.func,
  mode:         PropTypes.oneOf(["demo", "ws", "sse"]).isRequired,
  setMode:      PropTypes.func,
};

export default React.memo(Controls);
