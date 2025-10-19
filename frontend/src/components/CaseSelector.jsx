/**
 * @component CaseSelector
 * @description Компонент - выбор пациента и исследования (кейса). Управляет загрузкой пациентов и исследований, отображает выпадающие списки и модальное окно создания нового исследования.
 */
import React, { useEffect, useMemo, useRef, useCallback } from "react"
import { useSelector, useDispatch } from "react-redux"
import { ChevronDown, User, FolderPlus, Clock } from "lucide-react"

import { setCurrentPatient, setCurrentCase } from "../store/streamSlice"
import { getCases } from "../asyncActions/cases"
import { getPatients } from "../asyncActions/patients"
import { addCase } from "../store/caseSlice"

import CreateCaseModal from "./CreateCaseModal"
import { checkCaseHasData } from "../asyncActions/stream"
import { setCaseHasData } from "../store/streamSlice"

const tz = "Europe/Moscow"

// Заголовок: "Исследование DD.MM.YYYY HH:MM"
const fmtTitleDateTime = (v) => {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  const date = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: tz,
  }).format(d)
  const time = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  }).format(d)
  return `${date} ${time}`
}

const preview = (txt, n = 80) => {
  if (!txt) return null
  const oneLine = String(txt).replace(/\s+/g, " ").trim()
  if (!oneLine) return null
  return oneLine.length > n ? oneLine.slice(0, n) + "…" : oneLine
}

const ageFromBirthDate = (birth) => {
  if (!birth) return null
  const b = new Date(birth)
  if (Number.isNaN(b.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

const CaseSelector = () => {
  const dispatch = useDispatch()

  const user = useSelector((s) => s.app.user)
  const patient_array = useSelector((s) => s.patient.patient_array) ?? []
  const case_array = useSelector((s) => s.cases.case_array) ?? []
  const { currentPatient, currentCase, mode } = useSelector((s) => s.stream)

  // локальные состояния дропдаунов/модалки
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = React.useState(false)
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = React.useState(false)
  const [isCreateCaseOpen, setIsCreateCaseOpen] = React.useState(false)

  const patientDDRef = useRef(null)
  const caseDDRef = useRef(null)

  // 1) загрузить пациентов пользователя
  useEffect(() => {
    if (user?.id) {
      dispatch(getPatients(user.id))
    }
  }, [dispatch, user?.id])

  // 2) при смене пациента — подтянуть его кейсы
  useEffect(() => {
    if (currentPatient) {
      dispatch(getCases(currentPatient))
    }
  }, [dispatch, currentPatient])

  // 3) закрытие дропдаунов по клику вне/ESC
  useEffect(() => {
    const onClick = (e) => {
      if (isPatientDropdownOpen && patientDDRef.current && !patientDDRef.current.contains(e.target)) {
        setIsPatientDropdownOpen(false)
      }
      if (isCaseDropdownOpen && caseDDRef.current && !caseDDRef.current.contains(e.target)) {
        setIsCaseDropdownOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsPatientDropdownOpen(false)
        setIsCaseDropdownOpen(false)
        setIsCreateCaseOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [isPatientDropdownOpen, isCaseDropdownOpen])

  // выбранный пациент
  const selectedPatient = useMemo(() => {
    if (!patient_array.length || !currentPatient) return null
    return patient_array.find((p) => p.id === currentPatient) || null
  }, [patient_array, currentPatient])

  // ⬇️ кейсы выбранного пациента — отсортированы по дате (новые первыми) и ограничены 5 шт.
  const patientCases = useMemo(() => {
    if (!case_array.length || !currentPatient) return []
    const list = case_array.filter((c) => c.patient_id === currentPatient)
    list.sort((a, b) => {
      const ba = new Date(b.created_at ?? b.createdAt ?? 0).getTime()
      const aa = new Date(a.created_at ?? a.createdAt ?? 0).getTime()
      return ba - aa // новее выше
    })
    return list.slice(0, 5)
  }, [case_array, currentPatient])

  const handlePatientSelect = useCallback(
    (patient) => {
      dispatch(setCurrentPatient(patient.id))
      setIsPatientDropdownOpen(false)
      dispatch(setCurrentCase(null))
    },
    [dispatch]
  )

  const handleCaseSelect = useCallback(
    async (caseItem) => {
      dispatch(setCurrentCase(caseItem))
      const has = await dispatch(checkCaseHasData(caseItem.id)).unwrap()
      dispatch(setCaseHasData(has))
      setIsCaseDropdownOpen(false)
    },
    [dispatch]
  )

  const handleOpenCreateCase = useCallback(() => {
    if (!currentPatient) return
    setIsCaseDropdownOpen(false)
    setIsCreateCaseOpen(true)
  }, [currentPatient])

  const sortedPatients = useMemo(() => {
    return patient_array
      .slice()
      .sort((a, b) => {
        const nameA = a.name?.toLowerCase() || ''
        const nameB = b.name?.toLowerCase() || ''

        return nameA.localeCompare(nameB)
      })
  }, [patient_array])

  return (
    <div className="bg-white border border-gray-300 rounded-2xl shadow-sm p-4 mb-4 relative">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Пациент */}
        <div className="flex-1 relative" ref={patientDDRef}>
          <label className="block text-sm text-slate-500 mb-2">Пациент</label>
          <button
            onClick={() => setIsPatientDropdownOpen((v) => !v)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-gray-100 transition-colors h-[60px]" // Добавлена фиксированная высота
          >
            <div className="flex items-center space-x-3">
              <User size={20} className="text-slate-500" />
              <span className="text-slate-800">
                {selectedPatient ? selectedPatient.name : "Выберите пациента"}
              </span>
            </div>
            <ChevronDown size={16} className="text-slate-500" />
          </button>

          {isPatientDropdownOpen && (
            <div className="absolute w-full z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {sortedPatients.length > 0 ? (
                sortedPatients.map((patient) => {
                  const age = ageFromBirthDate(patient.birth_date)
                  return (
                    <button
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient)}
                      className="w-full px-4 py-3 text-left border-t border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-between first:border-t-0"
                    >
                      <span className="text-slate-800">{patient.name}</span>
                      {age !== null && (
                        <span className="text-sm text-slate-500">{age} лет</span>
                      )}
                    </button>
                  )
                })
              ) : (
                <div className="p-4 text-slate-500 text-center">Нет пациентов</div>
              )}
            </div>
          )}
        </div>

        {/* Исследование */}
        <div className="flex-1 w-full" ref={caseDDRef}>
          <label className="block text-sm text-slate-500 mb-2">Исследование</label>
          <button
            onClick={() => currentPatient && setIsCaseDropdownOpen((v) => !v)}
            disabled={!currentPatient}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[60px]">
            <div className="flex items-center space-x-3 w-full">
              <Clock size={20} className="text-slate-500" />
              <div className="flex-1 min-w-0">
                <div className="text-slate-800 font-medium truncate">
                  {currentCase
                    ? `Исследование ${fmtTitleDateTime(currentCase.created_at) || `#${currentCase.id}`}`
                    : currentPatient
                    ? "Выберите исследование"
                    : "Сначала выберите пациента"}
                </div>
                {currentCase?.description && (
                  <div className="text-slate-500 text-xs truncate">
                    {preview(currentCase.description, 60)}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown size={16} className="text-slate-500 ml-2 shrink-0" />
          </button>

            {isCaseDropdownOpen && currentPatient && (
            <div className="absolute z-10 mt-1 mr-4 bg-white border border-gray-300 rounded-lg shadow-lg">
              {/* Новое исследование */}
              <button
                onClick={handleOpenCreateCase}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center space-x-3 text-green-600"
              >
                <FolderPlus size={16} />
                <span>Новое исследование</span>
              </button>

              {/* Существующие */}
              {patientCases.length > 0 ? (
                patientCases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCaseSelect(c)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-t border-gray-300 first:border-t-0"
                  >
                    <div className="flex flex-col">
                      <div className="text-slate-800 font-medium truncate">
                        {`Исследование ${fmtTitleDateTime(c.created_at) || `#${c.id}`}`}
                      </div>
                      {c.description && (
                        <div className="text-slate-500 text-xs truncate">
                          {preview(c.description, 80)}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-slate-500 border-t border-gray-300 text-center">
                  Нет исследований
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Информация о режиме */}
      {mode === "reviewing" && currentCase && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-blue-700 text-sm">
            📊 Режим просмотра: Исследование {fmtTitleDateTime(currentCase.created_at) || `#${currentCase.id}`}
            {currentCase.description && (
              <span className="text-slate-600"> — {preview(currentCase.description, 80)}</span>
            )}
          </div>
        </div>
      )}

      {mode === "recording" && currentCase && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 text-sm">
            🔴 Режим записи: Исследование {fmtTitleDateTime(currentCase.created_at) || `#${currentCase.id}`}
            {currentCase.description && (
              <span className="text-slate-600"> — {preview(currentCase.description, 80)}</span>
            )}
          </div>
        </div>
      )}

      {/* Модалка создания кейса */}
      <CreateCaseModal
        isOpen={isCreateCaseOpen}
        onClose={() => setIsCreateCaseOpen(false)}
        patientId={currentPatient}
        patientName={selectedPatient?.name || ""}
        onCreated={(created) => {
          if (created?.id != null) {
            dispatch(addCase(created))
          }
          dispatch(setCurrentCase(created))
          setIsCreateCaseOpen(false)
          setIsCaseDropdownOpen(false)
        }}
      />
    </div>
  )
}

export default React.memo(CaseSelector)
