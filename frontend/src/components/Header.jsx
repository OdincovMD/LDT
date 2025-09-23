import { useDispatch, useSelector } from 'react-redux'
import { Menu, LogOut, UserCircle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

import { ENDPOINTS, PAGE_NAMES } from "../imports/ENDPOINTS"
import { logout, setCurrentPage } from '../store/appSlice'

export default function Header({ onToggleSidebar }) {

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const currentPage = useSelector(state => state.app.currentPage);
  const user = useSelector(state => state.app.user)

  const pageTitles = {
    [PAGE_NAMES.HOME]: 'Главная - Мониторинг системы',
    [PAGE_NAMES.ABOUT]: 'О нашей компании',
    [PAGE_NAMES.CONTACT]: 'Контактная информация',
    [PAGE_NAMES.LOGIN]: 'Вход в систему',
    [PAGE_NAMES.REGISTER]: 'Регистрация аккаунта'
  }

   const pageDescriptions = {
    [PAGE_NAMES.HOME]: 'Панель мониторинга в реальном времени',
    [PAGE_NAMES.ABOUT]: 'Информация о нашем проекте и команде',
    [PAGE_NAMES.CONTACT]: 'Свяжитесь с нами для сотрудничества',
    [PAGE_NAMES.LOGIN]: 'Введите ваши учетные данные',
    [PAGE_NAMES.REGISTER]: 'Создайте новый аккаунт'
  }

  const getCurrentPageFromPath = () => {
    const path = location.pathname;
    if (path === ENDPOINTS.HOME) return PAGE_NAMES.HOME;
    if (path === ENDPOINTS.ABOUT) return PAGE_NAMES.ABOUT;
    if (path === ENDPOINTS.CONTACT) return PAGE_NAMES.CONTACT;
    if (path === ENDPOINTS.LOGIN) return PAGE_NAMES.LOGIN;
    if (path === ENDPOINTS.REGISTER) return PAGE_NAMES.REGISTER;
    return PAGE_NAMES.HOME;
  }

  const currentPageName = getCurrentPageFromPath()
  const pageTitle = pageTitles[currentPageName] || 'Мониторинг системы'
  const pageDescription = pageDescriptions[currentPageName] || ''

  const handleLogout = () => {
    dispatch(logout())
    dispatch(setCurrentPage(PAGE_NAMES.LOGIN));
    navigate(ENDPOINTS.LOGIN);
  }

   return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Левая часть - кнопка меню и заголовок */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
              title="Переключить меню"
            >
              <Menu size={24} className="text-gray-600" />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {pageTitle}
              </h1>
              {pageDescription && (
                <p className="text-gray-600 text-sm mt-1">
                  {pageDescription}
                </p>
              )}
            </div>
          </div>

          {/* Правая часть - действия пользователя */}
          <div className="flex items-center space-x-3">
            {/* Информация о пользователе */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
                
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <UserCircle size={20} className="text-white" />
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-red-50 transition-colors duration-200"
                  title="Выйти из системы"
                >
                  <LogOut size={16} className="text-red-600" />
                  <span className="text-red-600 text-sm font-medium hidden md:inline">Выйти</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <UserCircle size={20} />
                <span>Гость</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}