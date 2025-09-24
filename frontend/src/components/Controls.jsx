import React from 'react'

function Controls({ connected, onConnect, onDisconnect, onClear, mode, setMode }) {
  return (
    <div className="flex items-center gap-3">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm text-white"
      >
        <option value="demo">Демо</option>
        <option value="ws">WebSocket</option>
        <option value="sse">SSE</option>
      </select>

      {!connected ? (
        <button
          onClick={onConnect}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm text-white"
        >
          Подключить
        </button>
      ) : (
        <button
          onClick={onDisconnect}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white"
        >
          Отключить
        </button>
      )}

      <button
        onClick={onClear}
        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white"
      >
        Очистить данные
      </button>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-xs">
          {connected ? 'Подключено' : 'Отключено'}
        </span>
      </div>
    </div>
  )
}

export default Controls