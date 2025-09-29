// components/RecordingControls.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { startRecording, stopRecording, saveRecording } from "../store/streamSlice";
import { Play, Square, Save, Activity } from "lucide-react";

function RecordingControls() {
  const dispatch = useDispatch();
  const {
    operationMode, // 'playback' | 'record'
    recordingMode, // 'idle' | 'recording' | 'reviewing'
    currentCase,
    hasUnsavedChanges,
    dataPoints,
  } = useSelector((state) => state.stream);

  // РЕЖИМ ПРОСМОТРА — никаких кнопок записи
  if (operationMode === "playback") {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="text-center text-slate-600 flex items-center justify-center gap-2">
          <Activity size={18} className="text-blue-500" />
          <span>Режим просмотра — запись недоступна</span>
        </div>
        <div className="text-center text-sm text-slate-500 mt-1">
          Переключитесь в режим «Запись», чтобы начать приём данных
        </div>
      </div>
    );
  }

  // РЕЖИМ ЗАПИСИ
  const canStart = currentCase && recordingMode !== "recording";
  const canStop = recordingMode === "recording";
  const canSave = (dataPoints?.length ?? 0) > 0 && !canStop;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* START */}
        <button
          onClick={() => dispatch(startRecording())}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
          disabled={!canStart}
          title={!currentCase ? "Выберите исследование" : ""}
        >
          <Play size={18} />
          Начать запись
        </button>

        {/* STOP */}
        <button
          onClick={() => dispatch(stopRecording())}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
          disabled={!canStop}
        >
          <Square size={18} />
          Остановить запись
        </button>

        {/* SAVE */}
        <button
          onClick={() => dispatch(saveRecording())}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
          disabled={!canSave}
          title={canStop ? "Остановите запись перед сохранением" : ""}
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
  );
}

export default RecordingControls;
