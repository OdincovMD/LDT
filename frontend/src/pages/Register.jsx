import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Check, X } from 'lucide-react'
import { useState, useEffect } from 'react'

import { ENDPOINTS, PAGE_NAMES } from "../imports/ENDPOINTS"
import { setRememberMe } from '../store/appSlice'
import { registerUser } from '../asyncActions/registerUser'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { loading, error, rememberMe } = useSelector(state => state.app)
  const password = watch('password', '')
  const confirmPassword = watch('confirmPassword', '')

  useEffect(() => {
    setValue('rememberMe', rememberMe)
  }, [rememberMe, setValue])

  const watchRememberMe = watch('rememberMe', rememberMe)

  useEffect(() => {
    dispatch(setRememberMe(watchRememberMe))
  }, [watchRememberMe, dispatch])

  useEffect(() => {
    const calculatePasswordStrength = (pass) => {
      let strength = 0
      if (pass.length >= 8) strength += 1
      if (/[A-Z]/.test(pass)) strength += 1
      if (/[0-9]/.test(pass)) strength += 1
      if (/[^A-Za-z0-9]/.test(pass)) strength += 1
      return strength
    }

    setPasswordStrength(calculatePasswordStrength(password))
  }, [password])

  const onSubmit = async (data) => {
    try {
      const result = await dispatch(registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      })).unwrap()
      
      // Если успешно, переходим на главную
      navigate(ENDPOINTS.HOME)

    } catch (error) {
      // Ошибка уже обработана в extraReducers
      console.error('Registration failed:', error)
    }
  }

  // Функция для отображения силы пароля
  const renderPasswordStrength = () => {
    const strengthText = ['Слабый', 'Средний', 'Хороший', 'Отличный']
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
    
    return (
      <div className="mt-2">
        <div className="flex space-x-1 mb-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-1 flex-1 rounded-full ${
                level <= passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className={`text-xs ${
          passwordStrength === 0 ? 'text-gray-500' : 
          passwordStrength <= 2 ? 'text-red-600' : 
          passwordStrength === 3 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {password ? strengthText[passwordStrength - 1] || 'Слабый' : 'Введите пароль'}
        </p>
      </div>
    )
  }

  // Проверка совпадения паролей
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Регистрация</h1>
            <p className="text-gray-600">Создайте новый аккаунт</p>
          </div>

          {/* Отображение ошибок */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
              <X size={16} className="mr-2" />
              {error}
            </div>
          )}

          {/* Форма регистрации */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Полное имя */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Полное имя
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input
                  {...register('name', {
                    required: 'Имя обязательно',
                    minLength: {
                      value: 2,
                      message: 'Имя должно быть не менее 2 символов'
                    },
                    maxLength: {
                      value: 50,
                      message: 'Имя должно быть не более 50 символов'
                    }
                  })}
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Иван Иванов"
                  disabled={loading}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X size={14} className="mr-1" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email адрес */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email адрес
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email обязателен',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Некорректный email адрес'
                    }
                  })}
                  type="email"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X size={14} className="mr-1" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Пароль */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Пароль обязателен',
                    minLength: {
                      value: 6,
                      message: 'Пароль должен быть не менее 6 символов'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Введите пароль"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
              {renderPasswordStrength()}
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X size={14} className="mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Подтверждение пароля */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Подтверждение пароля
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: 'Подтверждение пароля обязательно',
                    validate: value => value === password || 'Пароли не совпадают'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                    confirmPassword ? 
                      (passwordsMatch ? 'border-green-500 focus:ring-green-500' : 'border-red-500 focus:ring-red-500') 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="Повторите пароль"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
              {confirmPassword && (
                <p className={`mt-1 text-sm flex items-center ${
                  passwordsMatch ? 'text-green-600' : 'text-red-600'
                }`}>
                  {passwordsMatch ? (
                    <Check size={14} className="mr-1" />
                  ) : (
                    <X size={14} className="mr-1" />
                  )}
                  {passwordsMatch ? 'Пароли совпадают' : 'Пароли не совпадают'}
                </p>
              )}
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X size={14} className="mr-1" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Соглашение с условиями
            <div className="flex items-start space-x-3">
              <input
                {...register('terms', {
                  required: 'Необходимо согласие с условиями'
                })}
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                disabled={loading}
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                Я соглашаюсь с{' '}
                <Link to="/terms" className="text-green-600 hover:text-green-500 font-medium">
                  условиями использования
                </Link>{' '}
                и{' '}
                <Link to="/privacy" className="text-green-600 hover:text-green-500 font-medium">
                  политикой конфиденциальности
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600 flex items-center">
                <X size={14} className="mr-1" />
                {errors.terms.message}
              </p>
            )} */}

            {/* Запомнить меня */}
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Запомнить меня на этом устройстве
              </label>
            </div>

            {/* Кнопка регистрации */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Регистрация...
                </div>
              ) : (
                'Зарегистрироваться'
              )}
            </button>
          </form>

          {/* Ссылка на вход */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Уже есть аккаунт?{' '}
              <Link to={ENDPOINTS.LOGIN} className="text-green-600 hover:text-green-500 font-medium">
                Войти в систему
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register