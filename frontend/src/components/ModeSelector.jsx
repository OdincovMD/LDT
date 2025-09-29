// src/components/ModeSelector.jsx
import React, { useMemo, useCallback } from "react";
import { Play, FileText, Settings, Lock } from "lucide-react";
import PropTypes from "prop-types";

// Нормализация id режимов: поддерживаем оба варианта именования
const normalizeModeId = (id) => {
  switch (id) {
    case "simulation":
    case "recording":
      return "recording";
    case "playback":
    case "reviewing":
      return "reviewing";
    default:
      return id;
  }
};

const ModeSelector = ({
  currentMode,
  onModeChange,
  disabled = false,
  availableModes = null, // если null — вычислим из caseHasData
  caseHasData = null,
}) => {
  const normalizedCurrent = normalizeModeId(currentMode);

  // Итоговый список доступных режимов:
  //  - если передали availableModes → нормализуем и используем его
  //  - иначе выводим из caseHasData
  const available = useMemo(() => {
    if (Array.isArray(availableModes)) {
      return availableModes.map(normalizeModeId);
    }
    if (disabled) return [];
    if (caseHasData == null) {
      // неизвестно, есть ли данные → разрешим оба (пусть решит родитель)
      return ["recording", "reviewing"];
    }
    return caseHasData ? ["reviewing"] : ["recording"];
  }, [availableModes, disabled, caseHasData]);

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
  );

  const handleSelect = useCallback(
    (id) => {
      const norm = normalizeModeId(id);
      if (!disabled && available.includes(norm)) {
        onModeChange?.(norm);
      }
    },
    [available, disabled, onModeChange]
  );

  return (
    <div className="bg-slate-800 rounded-2xl p-4 mb-4">
      <div className="flex items-center space-x-2 mb-4">
        <Settings size={20} className="text-slate-400" />
        <h3 className="text-lg font-semibold text-white">Режим работы</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = normalizedCurrent === mode.id;
          const isAvailable = available.includes(mode.id);
          const isDisabled = disabled || !isAvailable;

          const base =
            "p-4 rounded-lg border-2 transition-all duration-200 text-left";
          const stateClass = isSelected
            ? "border-green-500 bg-green-500/10"
            : isAvailable
            ? "border-slate-600 bg-slate-700 hover:border-slate-500"
            : "border-slate-700 bg-slate-800 opacity-50";

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleSelect(mode.id)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              aria-label={mode.label}
              className={`${base} ${stateClass} ${
                isDisabled ? "cursor-not-allowed" : "cursor-pointer"
              } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isAvailable ? mode.color : "bg-slate-600"
                  }`}
                >
                  {isAvailable ? (
                    <Icon size={20} className="text-white" />
                  ) : (
                    <Lock size={20} className="text-slate-300" />
                  )}
                </div>

                <div className="text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold ${
                        isSelected
                          ? "text-green-400"
                          : isAvailable
                          ? "text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {mode.label}
                    </span>
                    {isSelected && isAvailable && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>

                  <p
                    className={`text-sm mt-1 ${
                      isAvailable ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {mode.description}
                  </p>

                  {/* Сообщения о недоступности */}
                  {!isAvailable && !isSelected && (
                    <p className="text-xs text-yellow-400 mt-1">
                      {mode.id === "recording" && caseHasData
                        ? "Недоступно: кейс уже содержит данные"
                        : mode.id === "reviewing" && caseHasData === false
                        ? "Недоступно: кейс пустой"
                        : "Недоступно"}
                    </p>
                  )}

                  {/* Для выбранного режима показываем статус */}
                  {isSelected && isAvailable && (
                    <p className="text-xs text-green-400 mt-1">✓ Текущий режим</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {disabled && (
        <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500 rounded text-yellow-400 text-sm text-center">
          Выберите исследование для активации режимов
        </div>
      )}

      {!disabled && (
        <div className="mt-3 p-2 bg-slate-700 rounded text-slate-300 text-sm text-center">
          {available.includes("recording") && available.includes("reviewing")
            ? "Доступны запись и просмотр"
            : available.includes("recording")
            ? "Кейс пустой — доступна запись"
            : available.includes("reviewing")
            ? "Кейс содержит данные — доступен просмотр"
            : "Режимы недоступны"}
        </div>
      )}
    </div>
  );
};

ModeSelector.propTypes = {
  currentMode: PropTypes.string, // 'recording'/'reviewing' или 'simulation'/'playback'
  onModeChange: PropTypes.func,
  disabled: PropTypes.bool,
  availableModes: PropTypes.arrayOf(PropTypes.string), // если не задан — вычислим из caseHasData
  caseHasData: PropTypes.bool, // влияет на доступность, когда availableModes не задан
};

export default React.memo(ModeSelector);
