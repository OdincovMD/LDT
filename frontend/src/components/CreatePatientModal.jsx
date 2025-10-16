/**
 * @component CreatePatientModal
 * @description Модальное окно создания нового пациента. Позволяет ввести ФИО и дату рождения пациента.
 */
// src/components/CreatePatientModal.jsx
import React, { useEffect, useRef, useCallback, useState } from "react"
import PropTypes from "prop-types"
import { useForm } from "react-hook-form"
import { X, User, Calendar, Save, ChevronDown } from "lucide-react"

const MAX_NAME = 100

// Кастомный компонент для ввода даты
const DateInput = ({ value, onChange, error, disabled }) => {
  const [day, setDay] = useState("")
  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")
  const [openDropdown, setOpenDropdown] = useState(null) // 'day', 'month', 'year', null
  
  const dayInputRef = useRef(null)
  const monthInputRef = useRef(null)
  const yearInputRef = useRef(null)

  // Генерация данных для выпадающих списков
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"))
  const months = [
    { value: "01", label: "Январь" }, { value: "02", label: "Февраль" },
    { value: "03", label: "Март" }, { value: "04", label: "Апрель" },
    { value: "05", label: "Май" }, { value: "06", label: "Июнь" },
    { value: "07", label: "Июль" }, { value: "08", label: "Август" },
    { value: "09", label: "Сентябрь" }, { value: "10", label: "Октябрь" },
    { value: "11", label: "Ноябрь" }, { value: "12", label: "Декабрь" }
  ]
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 150 }, (_, i) => (currentYear - i).toString())

  // Разбираем значение даты при изменении
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split("-")
      setYear(y || "")
      setMonth(m || "")
      setDay(d || "")
    } else {
      setDay("")
      setMonth("")
      setYear("")
    }
  }, [value])

  // Валидация и корректировка значений
  const validateAndCorrectDate = (d, m, y) => {
    let correctedDay = d
    let correctedMonth = m
    let correctedYear = y

    // Корректировка месяца (1-12)
    if (correctedMonth) {
      const monthNum = parseInt(correctedMonth)
      if (monthNum < 1) correctedMonth = "01"
      else if (monthNum > 12) correctedMonth = "12"
      else correctedMonth = correctedMonth.padStart(2, "0")
    }

    // Корректировка дня в зависимости от месяца и года
    if (correctedDay && correctedMonth) {
      const dayNum = parseInt(correctedDay)
      const monthNum = parseInt(correctedMonth)
      const yearNum = correctedYear ? parseInt(correctedYear) : currentYear
      
      // Определяем количество дней в месяце
      let daysInMonth = 31
      if ([4, 6, 9, 11].includes(monthNum)) {
        daysInMonth = 30
      } else if (monthNum === 2) {
        // Февраль: проверяем високосный год
        const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0)
        daysInMonth = isLeapYear ? 29 : 28
      }

      if (dayNum < 1) correctedDay = "01"
      else if (dayNum > daysInMonth) correctedDay = daysInMonth.toString().padStart(2, "0")
      else correctedDay = correctedDay.padStart(2, "0")
    } else if (correctedDay) {
      const dayNum = parseInt(correctedDay)
      if (dayNum < 1) correctedDay = "01"
      else if (dayNum > 31) correctedDay = "31"
      else correctedDay = correctedDay.padStart(2, "0")
    }

    return { correctedDay, correctedMonth, correctedYear }
  }

  // Обновляем общее значение даты
  const updateDate = (d, m, y) => {
    const { correctedDay, correctedMonth, correctedYear } = validateAndCorrectDate(d, m, y)
    
    setDay(correctedDay)
    setMonth(correctedMonth)
    setYear(correctedYear)

    if (correctedDay && correctedMonth && correctedYear && correctedYear.length === 4) {
      const formattedDate = `${correctedYear}-${correctedMonth}-${correctedDay}`
      onChange(formattedDate)
    } else {
      onChange("")
    }
  }

  const handleDayChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 2)
    updateDate(value, month, year)
  }

  const handleMonthChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 2)
    updateDate(day, value, year)
  }

  const handleYearChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4)
    updateDate(day, month, value)
  }

  const handleSelect = (type, value) => {
    switch (type) {
      case 'day':
        updateDate(value, month, year)
        break
      case 'month':
        updateDate(day, value, year)
        break
      case 'year':
        updateDate(day, month, value)
        break
    }
    setOpenDropdown(null)
    
    // Фокус на следующее поле
    if (type === 'day') monthInputRef.current?.focus()
    else if (type === 'month') yearInputRef.current?.focus()
  }

  const toggleDropdown = (type) => {
    setOpenDropdown(openDropdown === type ? null : type)
  }

  // Закрытие dropdown при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.date-input-container')) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getMonthName = (monthValue) => {
    const monthObj = months.find(m => m.value === monthValue)
    return monthObj ? monthObj.label : ""
  }

  return (
    <div className="date-input-container space-y-2">
      <div className="flex space-x-2">
        {/* День */}
        <div className="flex-1 relative">
          <label className="block text-xs text-gray-500 mb-1">День</label>
          <div className="relative">
            <input
              ref={dayInputRef}
              type="text"
              value={day}
              onChange={handleDayChange}
              onFocus={() => setOpenDropdown('day')}
              placeholder="ДД"
              disabled={disabled}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              maxLength={2}
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={() => toggleDropdown('day')}
              disabled={disabled}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Выпадающий список дней */}
          {openDropdown === 'day' && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelect('day', d)}
                  className={`w-full px-3 py-2 text-center hover:bg-blue-50 ${
                    day === d ? "bg-blue-100 text-blue-700" : ""
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Месяц */}
        <div className="flex-1 relative">
          <label className="block text-xs text-gray-500 mb-1">Месяц</label>
          <div className="relative">
            <input
              ref={monthInputRef}
              type="text"
              value={month}
              onChange={handleMonthChange}
              onFocus={() => setOpenDropdown('month')}
              placeholder="ММ"
              disabled={disabled}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              maxLength={2}
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={() => toggleDropdown('month')}
              disabled={disabled}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Выпадающий список месяцев */}
          {openDropdown === 'month' && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {months.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => handleSelect('month', m.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-blue-50 ${
                    month === m.value ? "bg-blue-100 text-blue-700" : ""
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Год */}
        <div className="flex-1 relative">
          <label className="block text-xs text-gray-500 mb-1">Год</label>
          <div className="relative">
            <input
              ref={yearInputRef}
              type="text"
              value={year}
              onChange={handleYearChange}
              onFocus={() => setOpenDropdown('year')}
              placeholder="ГГГГ"
              disabled={disabled}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              maxLength={4}
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={() => toggleDropdown('year')}
              disabled={disabled}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Выпадающий список годов */}
          {openDropdown === 'year' && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleSelect('year', y)}
                  className={`w-full px-3 py-2 text-center hover:bg-blue-50 ${
                    year === y ? "bg-blue-100 text-blue-700" : ""
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

const CreatePatientModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const wrapperRef = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    setFocus,
    setValue,
    watch,
  } = useForm({
    defaultValues: { fullName: "", birthDate: "" },
    mode: "onSubmit",
  })

  const birthDateValue = watch("birthDate")

  const handleDateChange = (date) => {
    setValue("birthDate", date, { shouldValidate: true })
  }

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
      reset()
      setTimeout(() => setFocus("fullName"), 0)
    }
  }, [isOpen, reset, setFocus])

  // Отправка формы → пробрасываем наверх
  const onSubmitForm = useCallback(
    async (data) => {
      // Защитимся от пустого ФИО
      if (!data.fullName?.trim()) {
        setError("fullName", { message: "ФИО обязательно для заполнения" })
        return
      }

      // Проверяем что дата заполнена (теперь обязательное поле)
      if (!data.birthDate) {
        setError("birthDate", { message: "Дата рождения обязательна для заполнения" })
        return
      }

      // Защитимся от неправильного возраста
      const d = new Date(data.birthDate)
      const today = new Date()
      const todayISO = today.toISOString().split("T")[0]
      const tenYearsMs = 10 * 365 * 24 * 60 * 60 * 1000
      const oneHundredYearsMs = 10 * tenYearsMs
      
      // Вычисляем разницу в миллисекундах (будущие даты будут положительными)
      const timeDiff = today - d

      if (Number.isNaN(d.getTime()) || data.birthDate > todayISO || timeDiff >= oneHundredYearsMs) {
        setError("birthDate", { message: "Некорректная дата" })
        return
      }

      if (timeDiff < tenYearsMs) {
        setError("birthDate", { message: "Пациент слишком молод" })
        return
      }

      await onSubmit?.({
        name: data.fullName.trim(),
        birth_date: data.birthDate,
      })

      reset()
    },
    [onSubmit, setError, reset]
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
                placeholder="Иванова Ирина Ивановна"
                disabled={submitDisabled}
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
              />
            </div>
            { errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          {/* Дата рождения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата рождения *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-8 flex items-center pointer-events-none">
                <Calendar size={20} className="text-gray-400" />
              </div>
              <div className="pl-10">
                <DateInput
                  value={birthDateValue}
                  onChange={handleDateChange}
                  error={errors.birthDate}
                  disabled={submitDisabled}
                />
              </div>
            </div>
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
            )}
            
            {/* Скрытое поле для react-hook-form */}
            <input
              {...register("birthDate", {
                required: "Дата рождения обязательна для заполнения",
              })}
              type="hidden"
            />
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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