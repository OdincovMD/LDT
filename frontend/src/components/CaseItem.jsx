// src/components/CaseItem.jsx
import React, { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Activity, Calendar, BarChart3, Play } from "lucide-react";
import PropTypes from "prop-types";

import { setCurrentCase, setCurrentPatient } from "../store/streamSlice";

const CaseItem = ({ caseItem }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!caseItem) {
    return (
      <div className="p-3 rounded-lg bg-red-50 text-red-700">
        Данные исследования недоступны
      </div>
    );
  }

  // дата одним объектом, чтобы не пересчитывать на каждый ререндер
  const createdAtText = useMemo(() => {
    const v = caseItem.created_at ?? caseItem.createdAt ?? null;
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Warsaw",
    }).format(d);
  }, [caseItem.created_at, caseItem.createdAt]);

  // показываем счётчик только если он есть числом
  const recordsCount =
    typeof caseItem.signals_count === "number"
      ? caseItem.signals_count
      : typeof caseItem.records_count === "number"
      ? caseItem.records_count
      : null;

  const handleOpen = useCallback(() => {
    // сохраняем выбранные сущности в стор
    if (caseItem.patient_id) {
      dispatch(setCurrentPatient(caseItem.patient_id));
    }
    dispatch(setCurrentCase(caseItem));
    // навигация на дашборд
    navigate("/dashboard");
  }, [caseItem, dispatch, navigate]);

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="w-full text-left flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Activity size={16} className="text-blue-600" />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">
              {caseItem.description || `Исследование #${caseItem.id}`}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <div className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>{createdAtText}</span>
            </div>
            {recordsCount !== null && (
              <div className="flex items-center space-x-1">
                <BarChart3 size={12} />
                <span>{recordsCount} записей</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm">
        <Play size={16} />
        <span>Открыть</span>
      </div>
    </button>
  );
};

CaseItem.propTypes = {
  caseItem: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    description: PropTypes.string,
    created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    patient_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    signals_count: PropTypes.number,
    records_count: PropTypes.number,
  }),
};

export default React.memo(CaseItem);
