import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, User, Calendar, Clock, Activity } from 'lucide-react'

import PatientCard from '../components/PatientCard'
import CreatePatientModal from '../components/CreatePatientModal'
import { createPatient, getPatients } from '../asyncActions/patients'


const Patients = () => {
  const dispatch = useDispatch()
  const user = useSelector(state => state.app)
  const cases = useSelector(state => state.case)
  const { patients, loading, error } = useSelector(state => state.patient)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
      console.error('Failed to create patient:', error)
    }
  }

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
    <div className="max-w-6xl mx-auto">

      {/* Пустое состояние */}
      {!loading && patients.length === 0 && (
        <div className="text-center py-12">
          <User size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Нет пациентов</h3>
          <p className="text-gray-600 mt-1">
            Добавьте первого пациента, чтобы начать работу
          </p>
        </div>
      )}

      {/* Кнопка добавления */}
      <div className="flex justify-between items-center mb-6">
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Добавить пациента</span>
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

      {/* Список пациентов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map(patient => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </div>

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