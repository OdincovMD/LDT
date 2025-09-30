/**
 * @component Sidebar
 * @description Боковая панель навигации приложения. Содержит меню для перехода между страницами и кнопку выхода.
 */
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { 
  Home,
  LogIn,
  User, 
  Mail, 
  ChevronLeft,
  Monitor,
  LogOut,
  Users
} from 'lucide-react'

import { FRONTEND_PAGES } from "../imports/ENDPOINTS"
import { logout, toggleSidebar } from '../store/appSlice'

export default function Sidebar({ isOpen }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector(state => state.app.user)

  const menuItems = [
    { path: FRONTEND_PAGES.HOME, label: 'Главная', icon: Home },
    ...(user ? [
      { path: FRONTEND_PAGES.PATIENTS, label: 'Мои пациенты', icon: Users },
      { path: FRONTEND_PAGES.DASHBOARD, label: 'Система', icon: Monitor }
    ] : []),
    { path: FRONTEND_PAGES.ABOUT, label: 'О нас', icon: User },
    user
      ? { path: FRONTEND_PAGES.LOGOUT, label: 'Выйти', icon: LogOut, isLogout: true }
      : { path: FRONTEND_PAGES.LOGIN, label: 'Войти', icon: LogIn }
  ]

  const handleLogout = () => {
    dispatch(logout())
    navigate(FRONTEND_PAGES.LOGIN)
  }

  const renderMenuItem = (item) => {
    const Icon = item.icon
    const isActive = 
      item.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.path) ||
          (location.pathname === FRONTEND_PAGES.REGISTER && item.path === FRONTEND_PAGES.LOGIN)

    const baseClasses = `flex items-center space-x-3 p-3 rounded-md transition-colors ease-in-out ${
      isActive ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 text-blue-100'
    }`

    // тултип при закрытом сайдбаре
    const tooltip = !isOpen ? { title: item.label } : {}

    if (item.isLogout) {
      return (
        <button
          key={item.path}
          onClick={handleLogout}
          className={`${baseClasses} w-full text-left`}
          aria-label={item.label}
          {...tooltip}
        >
          <Icon size={20} />
          {isOpen && <span>{item.label}</span>}
        </button>
      )
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={baseClasses}
        aria-label={item.label}
        {...tooltip}
      >
        <Icon size={20} />
        {isOpen && <span>{item.label}</span>}
      </Link>
    )
  }

  return (
    <div
      className={`${
        isOpen ? 'w-64' : 'w-16'
      } bg-blue-600 text-white min-h-screen fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out`}
    >
      <div className="p-4 flex items-center justify-between border-b border-blue-500">
        {isOpen && <h2 className="text-xl font-semibold">Меню</h2>}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 hover:bg-blue-700 rounded-md"
          aria-label={isOpen ? "Свернуть меню" : "Развернуть меню"}
        >
          <ChevronLeft size={24} className={isOpen ? '' : 'rotate-180'} />
        </button>
      </div>

      <nav className="p-2">
        <ul className="space-y-2">
          {menuItems.map(renderMenuItem)}
        </ul>
      </nav>
    </div>
  )
}
