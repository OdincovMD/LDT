import React from 'react'
import { useForm } from 'react-hook-form'
import { X, User, Calendar, Save } from 'lucide-react'

const CreatePatientModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const handleClose = () => {
    reset() // Очищаем форму
    onClose()
  }

  const onSubmitForm = (data) => {
    onSubmit({
      name: data.fullName,
      birth_date: data.birthDate || null
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Добавить пациента</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
          {/* ФИО пациента */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              ФИО пациента *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={20} className="text-gray-400" />
              </div>
              <input
                {...register('fullName', {
                  required: 'ФИО обязательно для заполнения',
                  minLength: {
                    value: 2,
                    message: 'ФИО должно содержать минимум 2 символа'
                  },
                  maxLength: {
                    value: 100,
                    message: 'ФИО не должно превышать 100 символов'
                  }
                })}
                type="text"
                id="fullName"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Иванов Иван Иванович"
                disabled={loading}
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          {/* Дата рождения */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
              Дата рождения
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={20} className="text-gray-400" />
              </div>
              <input
                {...register('birthDate')}
                type="date"
                id="birthDate"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                max={new Date().toISOString().split('T')[0]} // Нельзя выбрать будущую дату
                disabled={loading}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Необязательное поле
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Создание...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Создать</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePatientModal