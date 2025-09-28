import React from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { X, FileText, Save } from 'lucide-react'

import { createCase, getCases } from '../asyncActions/cases'

const CreateCaseModal = ({ isOpen, onClose, patientId, patientName }) => {

  const dispatch = useDispatch()
  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data) => {
    try {
      
      await dispatch(createCase({ patientId, description: data.description }))
      await dispatch(getCases( patientId ))
      handleClose()
    } catch (error) {
      console.error('Failed to create case:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Новое исследование</h2>
            <p className="text-sm text-gray-600 mt-1">Пациент: {patientName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Описание исследования */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Описание исследования
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText size={20} className="text-gray-400" />
              </div>
              <textarea
                {...register('description', {
                  maxLength: {
                    value: 500,
                    message: 'Описание не должно превышать 500 символов'
                  }
                })}
                id="description"
                rows={3}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Например: Плановое КТГ исследование, контроль после лечения..."
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Необязательное поле. Максимум 500 символов.
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Save size={20} />
              <span>Создать исследование</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCaseModal