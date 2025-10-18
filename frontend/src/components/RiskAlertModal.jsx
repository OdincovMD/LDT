/**
 * @component RiskAlertModal
 * @description алерт о рисках
 */
import React from 'react';

const RiskAlertModal = ({ isOpen, onClose, riskLevel, currentData, alertAt }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-end z-50 p-4 pointer-events-none">
      <div className="bg-white border border-red-300 rounded-lg shadow-lg max-w-xs w-full pointer-events-auto">
        {/* Заголовок и контент */}
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <h3 className="text-sm font-bold text-red-700">ВНИМАНИЕ</h3>
              </div>
              <p className="text-xs text-red-600 mb-2">
                Сработал сигнал модели (ALERT).{" "}
                <span className="font-semibold">
                  Оценка риска: {Number.isFinite(riskLevel) ? `${(riskLevel * 100).toFixed(1)}%` : "н/д"}
                </span>
              </p>
              <div className="text-[11px] text-gray-500">
                Время появления: <span className="font-medium">{alertAt ? new Date(alertAt).toLocaleString('ru-RU') : "—"}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-red-500 hover:text-red-700 transition-colors ml-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAlertModal;
