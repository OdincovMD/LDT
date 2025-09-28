// components/CaseSelector.jsx
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ChevronDown, User, FolderPlus, Clock } from 'lucide-react'
import { setCurrentPatient, setCurrentCase } from '../store/streamSlice'
import { createCase, getCases } from '../asyncActions/cases'
import { getPatients } from '../asyncActions/patients'

const CaseSelector = () => {
  const dispatch = useDispatch()
  
  const user = useSelector(state => state.app.user)
  const patient_array = useSelector(state => state.patient.patient_array)
  const case_array = useSelector(state => state.cases.case_array)
  const { currentPatient, currentCase, mode } = useSelector(state => state.stream)
  
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false)
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientCases, setPatientCases] = useState([])

    useEffect(() => {
        dispatch(getPatients(user.id))
    }, [dispatch])

   useEffect(() => {
    if (patient_array && currentPatient) {
      const patient = patient_array.find(p => p.id === currentPatient)
      setSelectedPatient(patient || null)
    } else {
      setSelectedPatient(null)
    }
  }, [patient_array, currentPatient])

  useEffect(() => {
    if (case_array && currentPatient) {
      const filteredCases = case_array.filter(c => c.patient_id === currentPatient)
      setPatientCases(filteredCases)
    } else {
      setPatientCases([])
    }
  }, [case_array, currentPatient])

  const handlePatientSelect = (patient) => {
    dispatch(setCurrentPatient(patient.id))
    dispatch(getCases(patient.id))
    setIsPatientDropdownOpen(false)
  }

  const handleCaseSelect = (caseItem) => {
    dispatch(setCurrentCase(caseItem))
    setIsCaseDropdownOpen(false)
  }

 const handleNewCase = async () => {
  if (!currentPatient) return
  
  try {
    // Создаем новое исследование
    const result = await dispatch(createCase({
      patientId: currentPatient,
      description: `Исследование от ${new Date().toLocaleDateString('ru-RU')}`
    })).unwrap()
    
    console.log('Созданное исследование:', result)
    
    dispatch(setCurrentCase(result))
    setIsCaseDropdownOpen(false)
  } catch (error) {
    console.error('Ошибка создания исследования:', error)
    alert(`Ошибка создания исследования: ${error.message}`)
  }
}

  return (
    <div className="bg-slate-800 rounded-2xl p-4 mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Выбор пациента */}
        <div className="flex-1">
          <label className="block text-sm text-slate-400 mb-2">Пациент</label>
          <div className="relative">
            <button
              onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-slate-600 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <User size={20} className="text-slate-400" />
                <span className="text-white">
                  {selectedPatient ? selectedPatient.name : 'Выберите пациента'}
                </span>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            
            {isPatientDropdownOpen && patient_array.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {patient_array.map(patient => (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-600 transition-colors flex items-center justify-between"
                  >
                    <span className="text-white">{patient.name}</span>
                    {patient.birth_date && (
                      <span className="text-sm text-slate-400">
                        {new Date().getFullYear() - new Date(patient.birth_date).getFullYear()} лет
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {isPatientDropdownOpen && patient_array.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg p-4">
                <div className="text-slate-400 text-center">Нет пациентов</div>
              </div>
            )}
          </div>
        </div>

        {/* Выбор исследования */}
        <div className="flex-1">
          <label className="block text-sm text-slate-400 mb-2">Исследование</label>
          <div className="relative">
            <button
              onClick={() => currentPatient && setIsCaseDropdownOpen(!isCaseDropdownOpen)}
              disabled={!currentPatient}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-3">
                <Clock size={20} className="text-slate-400" />
                <span className="text-white">
                  {currentCase ? 
                    (currentCase.description || `Исследование #${currentCase.id}`) : 
                    (currentPatient ? 'Выберите исследование' : 'Сначала выберите пациента')
                  }
                </span>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            
            {isCaseDropdownOpen && currentPatient && (
              <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg">
                {/* Кнопка создания нового исследования */}
                <button
                  onClick={handleNewCase}
                  className="w-full px-4 py-3 text-left hover:bg-slate-600 transition-colors flex items-center space-x-3 text-green-400"
                >
                  <FolderPlus size={16} />
                  <span>Новое исследование</span>
                </button>
                
                {/* Существующие исследования */}
                {patientCases.length > 0 ? (
                  patientCases.map(caseItem => (
                    <button
                      key={caseItem.id}
                      onClick={() => handleCaseSelect(caseItem)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-600 transition-colors border-t border-slate-600 first:border-t-0"
                    >
                      <div>
                        <div className="text-white font-medium">
                          {caseItem.description || `Исследование #${caseItem.id}`}
                        </div>
                        <div className="text-sm text-slate-400">
                          {new Date(caseItem.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-400 border-t border-slate-600 text-center">
                    Нет исследований
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Информация о текущем режиме */}
      {mode === 'reviewing' && currentCase && (
        <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="text-blue-400 text-sm">
            📊 Режим просмотра: {currentCase.description || `Исследование #${currentCase.id}`}
          </div>
        </div>
      )}
      
      {mode === 'recording' && currentCase && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="text-red-400 text-sm">
            🔴 Режим записи: {currentCase.description || `Исследование #${currentCase.id}`}
          </div>
        </div>
      )}
    </div>
  )
}

export default CaseSelector