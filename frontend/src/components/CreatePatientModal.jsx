/**
 * @component CreatePatientModal
 * @description Модальное окно создания нового пациента. Позволяет ввести ФИО и дату рождения пациента.
 */
// src/components/CreatePatientModal.jsx
import React, { useEffect, useRef, useCallback } from "react"
import PropTypes from "prop-types"
import { useForm } from "react-hook-form"
import { X, User, Calendar, Save } from "lucide-react"

const MAX_NAME = 100

const CreatePatientModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const wrapperRef = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    setFocus,
  } = useForm({
    defaultValues: { fullName: "", birthDate: "" },
    mode: "onSubmit",
  })

  const handleClose = useCallback(() => {
    reset()
    onClose?.()
  }, [onClose, reset])

  // Закрытие по ESC
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => e.key === "Escape" && handleClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isOpen, handleClose])

  // Клик по подложке — закрыть
  const onBackdropClick = useCallback(
    (e) => {
      if (e.target === wrapperRef.current) handleClose()
    },
    [handleClose]
  )

  // Автофокус на поле «ФИО» при открытии
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setFocus("fullName"), 0)
    }
  }, [isOpen, setFocus])

  // Отправка формы → пробрасываем наверх
  const onSubmitForm = useCallback(
    async (data) => {
      // Защитимся от пустого ФИО
      if (!data.fullName?.trim()) {
        setError("fullName", { message: "ФИО обязательно для заполнения" })
        return
      }

      // Защитимся от будущей даты
      if (data.birthDate) {
        const d = new Date(data.birthDate)
        const todayISO = new Date().toISOString().split("T")[0]
        if (Number.isNaN(d.getTime()) || data.birthDate > todayISO) {
          setError("birthDate", { message: "Некорректная дата" })
          return
        }
      }

      await onSubmit?.({
        name: data.fullName.trim(),
        birth_date: data.birthDate || null,
      })

      reset()
    },
    [onSubmit, setError]
  )

  if (!isOpen) return null

  const submitDisabled = loading || isSubmitting

  return (
    <div
      ref={wrapperRef}
      onMouseDown={onBackdropClick}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-patient-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full outline-none"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <h2 id="create-patient-title" className="text-xl font-semibold text-gray-900">
            Добавить пациента
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Закрыть модальное окно"
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
                {...register("fullName", {
                  required: "ФИО обязательно для заполнения",
                  minLength: { value: 2, message: "Минимум 2 символа" },
                  maxLength: { value: MAX_NAME, message: `Не более ${MAX_NAME} символов` },
                })}
                type="text"
                id="fullName"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Иванов Иван Иванович"
                disabled={submitDisabled}
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
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
                {...register("birthDate")}
                type="date"
                id="birthDate"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                max={new Date().toISOString().split("T")[0]}
                disabled={submitDisabled}
              />
            </div>
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">Необязательное поле</p>
          </div>

          {/* Кнопки */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitDisabled}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {submitDisabled ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                  <span>Создание…</span>
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

CreatePatientModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,   // вызывается с { name, birth_date }
  loading: PropTypes.bool,    // блокирует форму/кнопки
}

export default React.memo(CreatePatientModal)
