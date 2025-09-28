import { useDispatch, useSelector } from 'react-redux'
import { LogOut, UserCircle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

import { FRONTEND_PAGES, PAGE_NAMES } from "../imports/ENDPOINTS"
import { logout } from '../store/appSlice'

export default function Header() {
  const dispatch = useDispatch()
  const navigate = useLocation()
  const location = useLocation()

  const user = useSelector(state => state.app.user)
  const sidebarOpen = useSelector(state => state.app.sidebarOpen)

  const pageTitles = {
    [PAGE_NAMES.HOME]: 'Главная',
    [PAGE_NAMES.PATIENTS]: 'Мои пациенты',
    [PAGE_NAMES.DASHBOARD]: 'Система мониторинга',
    [PAGE_NAMES.ABOUT]: 'О нашей компании',
    [PAGE_NAMES.CONTACT]: 'Контактная информация',
    [PAGE_NAMES.LOGIN]: 'Вход в систему',
    [PAGE_NAMES.REGISTER]: 'Регистрация аккаунта'
  }

  const pageDescriptions = {
    [PAGE_NAMES.HOME]: 'Личный кабинет пользователя',
    [PAGE_NAMES.PATIENTS]: 'Управление пациентами и их исследованиями',
    [PAGE_NAMES.DASHBOARD]: 'Мониторинг в реальном времени',
    [PAGE_NAMES.ABOUT]: 'Информация о нашем проекте и команде',
    [PAGE_NAMES.CONTACT]: 'Свяжитесь с нами для сотрудничества',
    [PAGE_NAMES.LOGIN]: 'Введите ваши учетные данные',
    [PAGE_NAMES.REGISTER]: 'Создайте новый аккаунт',
  }

  const getCurrentPageFromPath = () => {
    const path = location.pathname
    switch (path) {
      case (FRONTEND_PAGES.HOME): return PAGE_NAMES.HOME
      case (FRONTEND_PAGES.PATIENTS): return PAGE_NAMES.PATIENTS
      case (FRONTEND_PAGES.DASHBOARD): return PAGE_NAMES.DASHBOARD
      case (FRONTEND_PAGES.ABOUT): return PAGE_NAMES.ABOUT
      case (FRONTEND_PAGES.CONTACT): return PAGE_NAMES.CONTACT
      case (FRONTEND_PAGES.LOGIN): return PAGE_NAMES.LOGIN
      case (FRONTEND_PAGES.REGISTER): return PAGE_NAMES.REGISTER
      default: return PAGE_NAMES.HOME
    }
  }

  const currentPageName = getCurrentPageFromPath()
  const pageTitle = pageTitles[currentPageName] || 'Мониторинг системы'
  const pageDescription = pageDescriptions[currentPageName] || ''

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
       <div className={`transition-all duration-300 ${
        sidebarOpen ? 'pl-64' : 'pl-16'  // Добавляем padding-left вместо margin
      }`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
            {/* Остальной код без изменений */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
              {pageDescription && <p className="text-gray-600 text-sm mt-1">{pageDescription}</p>}
            </div>

            {/* Правая часть - действия пользователя */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                  
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <UserCircle size={20} className="text-white" />
                  </div>
                {/*                   
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-red-50 transition-colors duration-200"
                    title="Выйти из системы"
                  >
                    <LogOut size={16} className="text-red-600" />
                    <span className="text-red-600 text-sm font-medium hidden md:inline">Выйти</span>
                  </button> 
                */}
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
      </div>
    </header>
  )
}