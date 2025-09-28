import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { startRecording, saveRecording } from '../store/streamSlice'

function RecordingControls() {
  const dispatch = useDispatch()
  const { operationMode, recordingMode, currentCase, hasUnsavedChanges, isSimulating, dataPoints } = useSelector(state => state.stream)

  // ФУНКЦИЯ ДЛЯ СОХРАНЕНИЯ И ПЕРЕКЛЮЧЕНИЯ РЕЖИМА
  const handleSaveAndComplete = async () => {
    if (currentCase && dataPoints.length > 0) {
      try {
        
        // Переключаем в режим просмотра
        dispatch(saveRecording())
        
        console.log('Данные сохранены, переключено в режим просмотра')
      } catch (error) {
        console.error('Ошибка сохранения данных:', error)
      }
    }
  }

  // В режиме playback кнопки записи не нужны
  if (operationMode === 'playback') {
  return (
    <div className="bg-slate-800 rounded-2xl p-4">
      <div className="text-center text-slate-400">
        📊 Режим просмотра - запись недоступна
      </div>
      <div className="text-center text-sm text-slate-500 mt-1">
        Файл содержит данные, доступен только просмотр
      </div>
    </div>
  )
}

  // В режиме simulation показываем кнопки записи
    return (
    <div className="bg-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-center space-x-4">
        {recordingMode === 'idle' ? (
          <button
            onClick={() => dispatch(startRecording())}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
            disabled={!currentCase}
          >
            ▶️ Начать запись данных
          </button>
        ) : (
          <>
            <button
              onClick={() => dispatch(saveRecording())}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white font-semibold"
            >
              ⏹️ Остановить запись и сохранить результат
            </button>
          </>
        )}
      </div>
      
      {/* Упрощенная информация о статусе */}
      {operationMode === 'simulation' && (
        <div className="text-center mt-2">
          <span className={`text-sm ${isSimulating ? 'text-green-400' : 'text-red-400'}`}>
            {isSimulating ? '🟢 Запись активна' : '🔴 Запись остановлена'}
          </span>
        </div>
      )}
    </div>
  )
}

export default RecordingControls