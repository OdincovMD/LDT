/**
 * @component Patients
 * @description Страница управления пациентами. Отображает список пациентов, позволяет добавлять новых, осуществлять поиск и сортировку.
 */
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, User, Search, ArrowUpDown } from 'lucide-react'

import PatientCard from '../components/PatientCard'
import CreatePatientModal from '../components/CreatePatientModal'

import { setCurrentPatient } from '../store/patientSlice'
import { createPatient, getPatients } from '../asyncActions/patients'
import { clearCases } from '../store/caseSlice'
import { getCases } from '../asyncActions/cases'

const Patients = () => {
  const dispatch = useDispatch()
  const user = useSelector(state => state.app.user)
  const { patient_array, loading, error, currentPatient } = useSelector(state => state.patient)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    dispatch(clearCases())
    dispatch(setCurrentPatient(null))
  }, [dispatch])

  useEffect(() => {
    if (user) {
      dispatch(getPatients(user.id))
    }
  }, [dispatch, user])

  const handleCreatePatient = async (patientData) => {
    try {
      await dispatch(createPatient({
        owner_id: user.id,
        ...patientData
      })).unwrap()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Не удалось создать пациента:', error)
    }
  }

  const handlePatientClick = async (patientId) => {
    if (currentPatient === patientId) {
      await dispatch(setCurrentPatient(null))
      await dispatch(clearCases())
      return
    }

    try {
      await dispatch(setCurrentPatient(null))
      await dispatch(getCases(patientId)).unwrap()
      await dispatch(setCurrentPatient(patientId))
    } catch (error) {
      console.error('Не удалось получить список исследований:', error)
    }
  }

  // Фильтрация и сортировка пациентов
  const filteredAndSortedPatients = patient_array
    .filter(patient => 
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const nameA = a.name?.toLowerCase() || ''
      const nameB = b.name?.toLowerCase() || ''
      
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB)
      } else {
        return nameB.localeCompare(nameA)
      }
    })

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-700">
            Пожалуйста, войдите в систему для доступа к пациентам
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Заголовок и управление */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Пациенты</h1>
          <p className="text-gray-600 mt-1">
            {patient_array.length} пациент{patient_array.length % 10 === 1 && patient_array.length % 100 !== 11 ? '' : 'ов'}
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Добавить пациента</span>
        </button>
      </div>

      {/* Панель поиска и сортировки */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Поиск по ФИО..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowUpDown size={20} className="text-gray-600" />
          <span>ФИО {sortOrder === 'asc' ? 'А-Я' : 'Я-А'}</span>
        </button>
      </div>

      {/* Состояние загрузки */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Пустое состояние */}
      {!loading && filteredAndSortedPatients.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <User size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Пациенты не найдены' : 'Нет пациентов'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Попробуйте изменить поисковый запрос'
              : 'Добавьте первого пациента, чтобы начать работу'
            }
          </p>
        </div>
      )}

      {/* Вертикальный список пациентов */}
      {!loading && filteredAndSortedPatients.length > 0 && (
        <div className="space-y-4">
          {filteredAndSortedPatients.map(patient => (
            <PatientCard 
              key={patient.id}
              patient={patient}
              isExpanded={currentPatient === patient.id}
              onClick={() => handlePatientClick(patient.id)}
            />
          ))}
        </div>
      )}

      <CreatePatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePatient}
        loading={loading}
      />
    </div>
  )
}

export default Patients