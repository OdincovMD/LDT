/**
 * @component ModeSelector
 * @description Компонент выбора режима работы: запись данных или просмотр существующих данных. Автоматически управляет доступностью режимов в зависимости от наличия данных.
 */
// src/components/ModeSelector.jsx
import React, { useMemo, useCallback, useEffect } from "react"
import { Play, FileText, Settings, Lock } from "lucide-react"
import PropTypes from "prop-types"

// Нормализация id режимов: поддерживаем разные обозначения
const normalizeModeId = (id) => {
  switch (id) {
    case "simulation":
    case "record":
    case "recording":
      return "recording"
    case "playback":
    case "reviewing":
      return "reviewing"
    default:
      return id
  }
}

const ModeSelector = ({
  currentMode,
  disabled = false,
  availableModes = null, // если null — вычислим из caseHasData
  caseHasData = null,
}) => {
  const normalizedCurrent = normalizeModeId(currentMode)

  // Итоговый список доступных режимов:
  //  - если передали availableModes → нормализуем и используем его
  //  - иначе выводим из caseHasData
  const available = useMemo(() => {
    if (Array.isArray(availableModes)) {
      return availableModes.map(normalizeModeId)
    }
    if (disabled) return []
    if (caseHasData == null) {
      // неизвестно, есть ли данные → разрешим оба (пусть решит родитель)
      return ["recording", "reviewing"]
    }
    return caseHasData ? ["reviewing"] : ["recording"]
  }, [availableModes, disabled, caseHasData])

  // Визуальный fallback: если текущий недоступен — подсветим единственный доступный
  const hasValidSelection = available.includes(normalizedCurrent)
  const visualSelectedId = hasValidSelection
    ? normalizedCurrent
    : available.length === 1
    ? available[0]
    : null

  const modes = useMemo(
    () => [
      {
        id: "recording",
        label: "Режим записи",
        description: "Запись данных в кейс",
        icon: Play,
        color: "bg-green-500",
      },
      {
        id: "reviewing",
        label: "Режим просмотра",
        description: "Отображение данных из существующего кейса",
        icon: FileText,
        color: "bg-blue-500",
      },
    ],
    []
  )

  return (
      <div className="bg-white rounded-2xl p-4 mb-4 shadow">
      <div className="flex items-center space-x-2 mb-4">
        <Settings size={20} className="text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-800">Режим работы</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon
          const isAvailable = available.includes(mode.id)
          const isDisabled = disabled || !isAvailable
          const isVisuallySelected = visualSelectedId === mode.id && isAvailable

          const base =
            "p-4 rounded-lg border-2 transition-all duration-200 text-left"
          const stateClass = isVisuallySelected
            ? "border-green-500 bg-green-50"
            : isAvailable
            ? "border-slate-300 bg-slate-100 hover:border-slate-400"
            : "border-slate-200 bg-slate-100 opacity-50"

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleSelect(mode.id)}
              disabled={isDisabled}
              aria-pressed={isVisuallySelected}
              aria-label={mode.label}
              className={`${base} ${stateClass} ${
                isDisabled ? "cursor-not-allowed" : "cursor-pointer"
              } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isAvailable ? mode.color : "bg-slate-300"
                  }`}
                >
                  {isAvailable ? (
                    <Icon size={20} className="text-white" />
                  ) : (
                    <Lock size={20} className="text-slate-500" />
                  )}
                </div>

                <div className="text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold ${
                      isVisuallySelected
                        ? "text-green-600"
                        : isAvailable
                        ? "text-slate-800"
                        : "text-slate-400"
                      }`}
                    >
                      {mode.label}
                    </span>
                    {isVisuallySelected && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>

                  <p
                    className={`text-sm mt-1 ${
                      isAvailable ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {mode.description}
                  </p>

                  {/* Статус для визуально выбранного режима */}
                  {isVisuallySelected && (
                    <p className="text-xs text-green-600 mt-1">✓ Текущий режим</p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {disabled && (
         <div className="mt-3 p-2 bg-yellow-100 border border-yellow-400 rounded text-yellow-700 text-sm text-center">
          Выберите исследование для активации режимов
        </div>
      )}
    </div>
  )
}

ModeSelector.propTypes = {
  currentMode: PropTypes.string, // 'record'/'playback' или 'recording'/'reviewing'
  disabled: PropTypes.bool,
  availableModes: PropTypes.arrayOf(PropTypes.string), // если не задан — вычислим из caseHasData
  caseHasData: PropTypes.bool, // влияет на доступность, когда availableModes не задан
}

export default React.memo(ModeSelector)
