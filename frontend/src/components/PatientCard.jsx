/**
 * @component PatientCard
 * @description Карточка пациента с основной информацией и списком исследований. Позволяет создавать новые исследования и переходить к дашборду пациента.
 */
// src/components/PatientCard.jsx
import React, { useMemo, useCallback, useEffect } from "react"
import PropTypes from "prop-types"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  User,
  Calendar,
  Clock,
  Plus,
  Activity,
  ChevronDown,
  Edit,
  Trash2,
} from "lucide-react"

import { setCurrentPatient } from "../store/streamSlice"
import { getCases } from "../asyncActions/cases"
import CaseItem from "./CaseItem"
import CreateCaseModal from "./CreateCaseModal"

const tz = "Europe/Warsaw"
const fmtDate = (v) => {
  if (!v) return "Не указана"
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return "Не указана"
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  }).format(d)
}

const fmtAge = (birth) => {
  if (!birth) return "Не указан"
  const b = new Date(birth)
  if (Number.isNaN(b.getTime())) return "Не указан"
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return `${age} лет`
}

const PatientCard = ({ patient, isExpanded, onClick }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const allCases = useSelector((state) => state.cases.case_array) ?? []

  // Фильтруем кейсы конкретного пациента
  const patientCases = useMemo(
    () => allCases.filter((c) => c.patient_id === patient?.id),
    [allCases, patient?.id]
  )

  const [isCreateCaseModalOpen, setIsCreateCaseModalOpen] = React.useState(false)

  // Ленивая загрузка кейсов при развороте
  useEffect(() => {
    if (isExpanded && patient?.id) {
      dispatch(getCases(patient.id))
    }
  }, [dispatch, isExpanded, patient?.id])

  const handleNavigateToDashboard = useCallback(
    (e) => {
      e.stopPropagation()
      if (!patient?.id) return
      dispatch(setCurrentPatient(patient.id))
      navigate("/dashboard")
    },
    [dispatch, navigate, patient?.id]
  )

  const handleOpenCreateCase = useCallback((e) => {
    e.stopPropagation()
    setIsCreateCaseModalOpen(true)
  }, [])

  if (!patient) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-4">
        <div className="text-gray-600">Данные пациента недоступны</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
      {/* Заголовок карточки */}
      <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={onClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {patient.name || "Не указано"}
              </h3>
              <p className="text-gray-600 text-sm">Возраст: {fmtAge(patient.birth_date)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ChevronDown
              size={20}
              className={`text-gray-400 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              aria-label={isExpanded ? "Свернуть" : "Развернуть"}
            />
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar size={14} />
            <span>{fmtDate(patient.birth_date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock size={14} />
            <span>Создан: {fmtDate(patient.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Развёрнутый блок */}
      {isExpanded && (
        <div className="border-t border-gray-300 p-4" onClick={(e) => e.stopPropagation()}>
          {/* Заголовок исследований */}
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-900">Исследования</h4>
            <button
              onClick={handleOpenCreateCase}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
            >
              <Plus size={16} />
              <span>Новое исследование</span>
            </button>
          </div>

          {/* Список исследований пациента */}
          <div className="space-y-2">
            {patientCases.length > 0 ? (
              patientCases.map((caseItem) => (
                <CaseItem key={caseItem.id} caseItem={caseItem} />
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                <Activity size={32} className="mx-auto mb-2 text-gray-300" />
                Нет исследований
              </div>
            )}
          </div>

          {/* Действия */}
          <div className="flex space-x-2 mt-4 pt-3 border-top border-gray-100">
            <button
              onClick={handleNavigateToDashboard}
              className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-blue-700"
            >
              Открыть пациента в системе
            </button>
          </div>
        </div>
      )}

      {/* Модалка создания исследования */}
      <CreateCaseModal
        isOpen={isCreateCaseModalOpen}
        onClose={() => setIsCreateCaseModalOpen(false)}
        patientId={patient.id}
        patientName={patient.name}
      />
    </div>
  )
}

PatientCard.propTypes = {
  patient: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    birth_date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  isExpanded: PropTypes.bool,
  onClick: PropTypes.func,
}

export default React.memo(PatientCard)
