import React from 'react'
import { Play, FileText, Settings, Lock } from 'lucide-react'

const ModeSelector = ({ currentMode, onModeChange, disabled, availableModes = [], caseHasData }) => {
  const modes = [
    {
      id: 'simulation',
      label: 'Режим записи',
      description: 'Запись данных в кейс',
      icon: Play,
      color: 'bg-green-500'
    },
    {
      id: 'playback', 
      label: 'Режим просмотра',
      description: 'Отображение данных из существующего кейса',
      icon: FileText,
      color: 'bg-blue-500'
    }
  ]

  return (
    <div className="bg-slate-800 rounded-2xl p-4 mb-4">
      <div className="flex items-center space-x-2 mb-4">
        <Settings size={20} className="text-slate-400" />
        <h3 className="text-lg font-semibold text-white">Режим работы</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon
          const isSelected = currentMode === mode.id
          const isAvailable = availableModes.includes(mode.id)
          const isDisabled = disabled || !isAvailable
          
          return (
            <button
              key={mode.id}
              onClick={() => !isDisabled && onModeChange(mode.id)}
              disabled={isDisabled}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                isSelected 
                  ? 'border-green-500 bg-green-500/10' 
                  : isAvailable
                    ? 'border-slate-600 bg-slate-700 hover:border-slate-500'
                    : 'border-slate-700 bg-slate-800 opacity-50'
              } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isAvailable ? mode.color : 'bg-slate-600'
                }`}>
                  {isAvailable ? (
                    <Icon size={20} className="text-white" />
                  ) : (
                    <Lock size={20} className="text-slate-400" />
                  )}
                </div>
                
                <div className="text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${
                      isSelected ? 'text-green-400' : 
                      isAvailable ? 'text-white' : 'text-slate-400'
                    }`}>
                      {mode.label}
                    </span>
                    {isSelected && isAvailable && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    {!isAvailable && (
                      <Lock size={16} className="text-slate-400" />
                    )}
                  </div>
                  
                  <p className={`text-sm mt-1 ${
                    isAvailable ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {mode.description}
                  </p>
                  
                  {/* Сообщения о недоступности */}
                  {!isAvailable && !isSelected && (
                    <p className="text-xs text-yellow-400 mt-1">
                      {mode.id === 'simulation' && caseHasData 
                        ? 'Недоступно: файл уже содержит данные' 
                        : mode.id === 'playback' && !caseHasData
                        ? 'Недоступно: файл не содержит данных'
                        : 'Недоступно'
                      }
                    </p>
                  )}
                  
                  {/* Для выбранного режима показываем статус */}
                  {isSelected && isAvailable && (
                    <p className="text-xs text-green-400 mt-1">
                      ✓ Текущий режим
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      
      {disabled && (
        <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500 rounded text-yellow-400 text-sm text-center">
          Выберите исследование для активации режимов
        </div>
      )}
      
      {/* Информация о доступных режимах */}
      {!disabled && availableModes.length > 0 && (
        <div className="mt-3 p-2 bg-slate-700 rounded text-slate-300 text-sm text-center">
          {caseHasData 
            ? 'Файл содержит данные - доступен только режим просмотра'
            : 'Файл пустой - доступен только режим записи'
          }
        </div>
      )}
    </div>
  )
}

export default ModeSelector