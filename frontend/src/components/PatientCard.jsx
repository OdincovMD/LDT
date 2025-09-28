import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { User, Calendar, Clock, Plus, Activity, ChevronDown, Edit, Trash2 } from 'lucide-react'


import { setCurrentPatient } from '../store/streamSlice'
import CaseItem from './CaseItem'
import CreateCaseModal from './CreateCaseModal'

const PatientCard = ({ patient, isExpanded, onClick }) => {

  const dispatch = useDispatch()
  const cases = useSelector(state => state.cases)

  const [isCreateCaseModalOpen, setIsCreateCaseModalOpen] = React.useState(false)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Не указан'
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return `${age} лет`
  }

  const handleNavigateToDashboard = () => {
    dispatch(setCurrentPatient(patient.id))
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Заголовок карточки */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {patient.name || 'Не указано'}
              </h3>
              <p className="text-gray-600 text-sm">
                Возраст: {calculateAge(patient.birth_date)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ChevronDown 
              size={20} 
              className={`text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar size={14} />
            <span>Рожд.: {patient.birth_date ? formatDate(patient.birth_date) : 'Не указана'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock size={14} />
            <span>Создан: {formatDate(patient.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Развернутое содержимое */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          {/* Заголовок исследований */}
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-900">Исследования</h4>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsCreateCaseModalOpen(true)
              }}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
            >
              <Plus size={16} />
              <span>Новое исследование</span>
            </button>
          </div>

          {/* Список исследований */}
          <div className="space-y-2">
            {cases.case_array && cases.case_array.length > 0 ? (
              cases.case_array.map(caseItem => (
                <CaseItem key={caseItem.id} caseItem={caseItem} />
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                <Activity size={32} className="mx-auto mb-2 text-gray-300" />
                Нет исследований
              </div>
            )}
          </div>

          {/* Действия с пациентом */}
          <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
            <Link
              onClick = {handleNavigateToDashboard}
              to={`/dashboard`}
              className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-blue-700"
            >
              Открыть пациента в системе
            </Link>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Edit size={16} />
            </button>
            <button className="p-2 text-gray-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно создания исследования */}
      <CreateCaseModal
        isOpen={isCreateCaseModalOpen}
        onClose={() => setIsCreateCaseModalOpen(false)}
        patientId={patient.id}
        patientName={patient.name}
      />
    </div>
  )
}

export default PatientCard