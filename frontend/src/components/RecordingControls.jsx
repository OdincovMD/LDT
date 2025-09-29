// components/RecordingControls.jsx
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { startRecording, stopRecording, saveRecording } from '../store/streamSlice'

function RecordingControls() {
  const dispatch = useDispatch()
  const {
    operationMode,      // 'playback' | 'record'
    recordingMode,      // 'idle' | 'recording' | 'reviewing'
    currentCase,
    hasUnsavedChanges,
    dataPoints,
  } = useSelector(state => state.stream)

  // РЕЖИМ ПРОСМОТРА — никаких кнопок записи
  if (operationMode === 'playback') {
    return (
      <div className="bg-slate-800 rounded-2xl p-4">
        <div className="text-center text-slate-400">
          📊 Режим просмотра — запись недоступна
        </div>
        <div className="text-center text-sm text-slate-500 mt-1">
          Выберите режим «Запись», чтобы начать приём данных
        </div>
      </div>
    )
  }

  // РЕЖИМ ЗАПИСИ
  const canStart = currentCase && recordingMode !== 'recording'
  const canStop = recordingMode === 'recording'
  const canSave = (dataPoints?.length ?? 0) > 0 && !canStop // сохраняем только когда не пишем

  return (
    <div className="bg-slate-800 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* START */}
        <button
          onClick={() => dispatch(startRecording())}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
          disabled={!canStart}
          title={!currentCase ? 'Выберите исследование' : ''}
        >
          ▶️ Начать запись
        </button>

        {/* STOP */}
        <button
          onClick={() => dispatch(stopRecording())}
          className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
          disabled={!canStop}
        >
          ⏸️ Остановить запись
        </button>

        {/* SAVE */}
        <button
          onClick={() => dispatch(saveRecording())}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
          disabled={!canSave}
          title={canStop ? 'Остановите запись перед сохранением' : ''}
        >
          ⏺️ Сохранить и перейти к просмотру
        </button>
      </div>

      {/* Индикация статуса */}
      <div className="text-center mt-3 text-sm">
        {recordingMode === 'recording' ? (
          <span className="text-green-400">🟢 Запись активна</span>
        ) : hasUnsavedChanges ? (
          <span className="text-amber-300">🟠 Есть несохранённые данные</span>
        ) : (
          <span className="text-slate-400">⚪ Ожидание начала записи</span>
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
