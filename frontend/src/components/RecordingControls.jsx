/**
 * @component RecordingControls
 * @description Компонент управления записью данных. Позволяет запускать, останавливать запись и сохранять данные в режиме записи.
 */
// components/RecordingControls.jsx
import React from "react"
import { useSelector, useDispatch } from "react-redux"
import { startRecording, stopRecording, saveRecording } from "../store/streamSlice"
import { Play, Square, Save, Activity } from "lucide-react"

function RecordingControls({ connected = false, wsActive = false, usbActive = false, onStopWs = () => {} }) {
  const dispatch = useDispatch()
  const {
    operationMode, // 'playback' | 'record'
    recordingMode, // 'idle' | 'recording' | 'reviewing'
    currentCase,
    hasUnsavedChanges,
    dataPoints,
  } = useSelector((state) => state.stream)

  // РЕЖИМ ПРОСМОТРА — никаких кнопок записи
  if (operationMode === "playback") {
    return (
      <div className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm">
        <div className="text-center text-slate-600 flex items-center justify-center gap-2">
          <Activity size={18} className="text-blue-500" />
          <span>Режим просмотра — запись недоступна</span>
        </div>
      </div>
    )
  }

  // РЕЖИМ ЗАПИСИ
  // При активном потоковом источнике (WS или USB): «Старт» скрыт «Стоп» всегда доступен для отключения пуллинга.
  const liveActive = wsActive || usbActive
  const canStart = !liveActive && currentCase && recordingMode !== "recording"
  const canStop = liveActive ? true : recordingMode === "recording"
  // В live-кейсе (WS/USB) кнопки «Стоп записи» нет, поэтому Save активна, если есть данные
  const canSave = liveActive
    ? (dataPoints?.length ?? 0) > 0
    : (dataPoints?.length ?? 0) > 0 && !canStop

  // Пока источник не выбран/не подключен — показываем подсказку, без кнопок
  if (!connected) {
    return (
      <div className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm">
        <div className="text-center text-slate-600 flex items-center justify-center gap-2">
          <Activity size={18} className="text-blue-500" />
          <span>Выберите источник и нажмите «Подключить»</span>
        </div>
        <div className="text-center text-sm text-slate-500 mt-1">
          Источник: DEMO / WS / USB в блоке управления подключением
        </div>
      </div>
    )
  }


   const handleSave = () => {
    if (liveActive) onStopWs()  // отключить теневой пуллинг источника (WS/USB)
    // Дополнительно выводим из 'recording', чтобы UI не мигал статусом
    if (recordingMode === "recording") dispatch(stopRecording())
    dispatch(saveRecording())
  }

  return (
    <div className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* START — скрыт в WS-режиме */}
        {!liveActive && (
          <button
            onClick={() => dispatch(startRecording())}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
            disabled={!canStart}
            title={!currentCase ? "Выберите исследование" : ""}
          >
            <Play size={18} />
            Начать запись
          </button>
        )}

        {/* STOP */}
        {!liveActive && (
          <button
            onClick={() => dispatch(stopRecording())}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
          disabled={!canStop}
        >
          <Square size={18} />
          Остановить запись
        </button>
        )}

        {/* SAVE */}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
          disabled={!canSave}
          title={liveActive ? "Завершить сессию датчика и перейти к просмотру"
                          : (canStop ? "Остановите запись перед сохранением" : "")}
        >
          <Save size={18} />
          Сохранить и перейти к просмотру
        </button>
      </div>

      {/* Индикация статуса */}
      <div className="text-center mt-3 text-sm">
        {recordingMode === "recording" ? (
          <span className="text-green-600 flex items-center justify-center gap-1">
            <Activity size={14} className="text-green-600" />
            Запись активна
          </span>
        ) : hasUnsavedChanges ? (
          <span className="text-amber-600 flex items-center justify-center gap-1">
            <Activity size={14} className="text-amber-600" />
            Есть несохранённые данные
          </span>
        ) : (
          <span className="text-slate-500 flex items-center justify-center gap-1">
            <Activity size={14} className="text-slate-400" />
            Ожидание начала записи
          </span>
        )}
      </div>

      {/* Подсказка по контексту */}
      {!currentCase && (
        <div className="text-center text-xs text-slate-500 mt-2">
          Выберите исследование, чтобы активировать запись
        </div>
      )}
    </div>
  )
}

export default RecordingControls
