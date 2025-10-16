/**
 * @component CaseItem
 * @description Карточка медицинского исследования (кейса). Отображает информацию о случае, дату создания и количество записей. При клике открывает дашборд с данными исследования.
 */
// src/components/CaseItem.jsx
import React, { useCallback, useMemo } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Activity, Calendar, BarChart3, Play } from "lucide-react"
import PropTypes from "prop-types"

import { setCurrentCase, setCurrentPatient } from "../store/streamSlice"

const TZ = "Europe/Warsaw"

const formatDateTimeReadable = (v) => {
  if (!v) return "—"
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d)
}

const formatDateTimeForTitle = (v) => {
  if (!v) return ""
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ""
  // Короткий формат для имени по умолчанию
  const date = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TZ,
  }).format(d)
  const time = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d)
  return `${date} ${time}`
}

const CaseItem = ({ caseItem }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  if (!caseItem) {
    return (
      <div className="p-3 rounded-lg bg-red-50 text-red-700">
        Данные исследования недоступны
      </div>
    )
  }

  const createdRaw = caseItem.created_at ?? caseItem.createdAt ?? null

  // Читаемая дата для мета-строки
  const createdAtText = useMemo(() => formatDateTimeReadable(createdRaw), [createdRaw])

  // Имя по умолчанию: "Исследование DD.MM.YYYY HH:MM"
  const defaultTitle = useMemo(() => {
    const when = formatDateTimeForTitle(createdRaw)
    return when ? `Исследование ${when}` : `Исследование #${caseItem.id}`
  }, [createdRaw, caseItem.id])

  // Заголовок: описание, иначе — имя по умолчанию
  const titleText = caseItem.description?.trim() ? caseItem.description : defaultTitle

  // Счётчик записей (если есть)
  const recordsCount =
    typeof caseItem.signals_count === "number"
      ? caseItem.signals_count
      : typeof caseItem.records_count === "number"
      ? caseItem.records_count
      : null

  const handleOpen = useCallback(() => {
    if (caseItem.patient_id) {
      dispatch(setCurrentPatient(caseItem.patient_id))
    }
    dispatch(setCurrentCase(caseItem))
    navigate("/dashboard")
  }, [caseItem, dispatch, navigate])

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="w-full text-left flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      title={titleText}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Activity size={16} className="text-blue-600" />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">
              {titleText}
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
  )
}

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
}

export default React.memo(CaseItem)
