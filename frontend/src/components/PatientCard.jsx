import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Calendar, Clock, Plus, Activity, Trash2, Edit } from 'lucide-react'

import { useDispatch, useSelector } from 'react-redux'
import { createCase, getCases } from '../asyncActions/cases'

import CaseItem from './CaseItem'
import CreateCaseModal from './CreateCaseModal'

const PatientCard = ({ patient }) => {
  const dispatch = useDispatch()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isCreateCaseModalOpen, setIsCreateCaseModalOpen] = useState(false)

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

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Заголовок карточки */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
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
          
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
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
            {patient.cases && patient.cases.length > 0 ? (
              patient.map(patient => (
                
                <CaseItem key={caseItem.id} patientId={patient.id} />
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
              to={`/dashboard?patientId=${patient.id}`}
              className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-blue-700"
            >
              Открыть в системе
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