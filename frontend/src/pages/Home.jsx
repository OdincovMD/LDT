import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { User, LogIn, Mail, UserPlus } from 'lucide-react'

import { ENDPOINTS, PAGE_NAMES } from "../imports/ENDPOINTS"

export default function Home() {
  const user = useSelector(state => state.app.user)
  const loading = useSelector(state => state.app.loading)

  // Если данные еще загружаются
  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  // Если пользователь не авторизован
  if (!user) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Иконка */}
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <LogIn className="text-blue-600" size={40} />
          </div>
          
          {/* Заголовок */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Войдите в аккаунт
          </h2>
          
          {/* Описание */}
          <p className="text-gray-600 mb-8">
            Для доступа к системе необходимо авторизоваться
          </p>

          {/* Кнопки действий */}
          <div className="flex flex-col gap-4">
            <Link
              to={ENDPOINTS.LOGIN}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <LogIn size={20} className="mr-2" />
              Войти в аккаунт
            </Link>
            
            <Link
              to={ENDPOINTS.REGISTER}
              className="inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200"
            >
              <UserPlus size={20} className="mr-2" />
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Если пользователь авторизован - показываем только основную информацию
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-xl p-8">
        {/* Аватар и приветствие */}
        <div className="text-center mb-6">
          <div className="mx-auto w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <User className="text-white" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Добро пожаловать!
          </h1>
          <p className="text-gray-600">Ваш профиль</p>
        </div>

        {/* Информация о пользователе */}
        <div className="space-y-4">
          {/* ФИО */}
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <User size={20} className="text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">ФИО</p>
              <p className="font-medium text-gray-900">{user.name}</p>
            </div>
          </div>

          {/* Почта */}
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Mail size={20} className="text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}