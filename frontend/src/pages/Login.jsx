/**
 * @component Login
 * @description Страница входа в систему. Содержит форму аутентификации с полями email и пароль, обработку запоминания пользователя и отображение ошибок.
 */
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Mail, Lock, LogIn, Eye, EyeOff, X } from 'lucide-react'
import { useState, useEffect } from 'react'

import { FRONTEND_PAGES, PAGE_NAMES } from "../imports/ENDPOINTS"
import { setRememberMe, clearError } from '../store/appSlice'
import { loginUser } from '../asyncActions/loginUser'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors }, watch, setValue} = useForm()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { loading, error, rememberMe } = useSelector(state => state.app)

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  useEffect(() => {
    setValue('rememberMe', rememberMe)
  }, [rememberMe, setValue])

  const watchRememberMe = watch('rememberMe', rememberMe)

  useEffect(() => {
  dispatch(setRememberMe(watchRememberMe))
  }, [watchRememberMe, dispatch])

  const onSubmit = async (data) => {
    try {
      // Диспатчим асинхронный thunk с fetch
      const result = await dispatch(loginUser({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      })).unwrap()
      
      // Если успешно, перенаправляем
      navigate(FRONTEND_PAGES.HOME)

    } catch (error) {
      // Ошибка уже обработана в extraReducers
      console.error('Login failed:', error.details)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <LogIn className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Вход в систему</h1>
            <p className="text-gray-600">Введите ваши учетные данные</p>
          </div>

          {/* Отображение ошибок */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
              <X size={16} className="mr-2" />
              {error}
            </div>
          )}

          {/* Форма */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
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
                      value: 8,
                      message: 'Пароль должен быть не менее 8 символов'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register('rememberMe')}
                  id="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Запомнить меня
                </label>
              </div>
              {/* <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                Забыли пароль?
              </Link> */}
            </div>

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Вход...' : 'Войти в систему'}
            </button>
          </form>

          {/* Ссылка на регистрацию */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Еще нет аккаунта?{' '}
              <Link to={FRONTEND_PAGES.REGISTER} className="text-blue-600 hover:text-blue-500 font-medium">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login