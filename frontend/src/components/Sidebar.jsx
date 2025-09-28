import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Link, useLocation } from 'react-router-dom'
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

import { FRONTEND_PAGES, PAGE_NAMES } from "../imports/ENDPOINTS"
import { logout, toggleSidebar } from '../store/appSlice'

export default function Sidebar({ isOpen }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const user = useSelector(state => state.app.user)

  const baseMenuItems = {
    HOME: { path: FRONTEND_PAGES.HOME, label: 'Главная', icon: Home },
    ABOUT: { path: FRONTEND_PAGES.ABOUT, label: 'О нас', icon: User },
    CONTACTS: { path: FRONTEND_PAGES.CONTACT, label: 'Контакты', icon: Mail }
  }

  const authMenuItems = {
    DASHBOARD: { path: FRONTEND_PAGES.DASHBOARD, label: 'Система', icon: Monitor },
    USERS: {path: FRONTEND_PAGES.PATIENTS, label: 'Мои пациенты', icon: Users},
    LOGOUT: { path: FRONTEND_PAGES.LOGOUT, label: 'Выйти', icon: LogOut },
}

  const unauthMenuItems = {
    LOGIN: { path: FRONTEND_PAGES.LOGIN, label: 'Войти', icon: LogIn },
  }

  const menuItems = [
    baseMenuItems.HOME,
    ...(user ? [authMenuItems.USERS, authMenuItems.DASHBOARD] : []),
    baseMenuItems.ABOUT,
    baseMenuItems.CONTACTS,
    ...(user ? [authMenuItems.LOGOUT] : [unauthMenuItems.LOGIN]),
  ]

  const handleLogout = () => {
    dispatch(logout())
    navigate(FRONTEND_PAGES.LOGIN)
  }

  if (!isOpen) {
    return (
      <div className="w-16 bg-blue-600 min-h-screen fixed left-0 top-0 z-40">
        <div className="p-4">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="text-white p-2 hover:bg-blue-700 rounded-md"
          >
            <ChevronLeft size={24} className="rotate-180" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-blue-600 text-white min-h-screen fixed left-0 top-0 z-40 transition-all duration-300">
      <div className="p-4 flex items-center justify-between border-b border-blue-500">
        <h2 className="text-xl font-semibold">Меню</h2>
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 hover:bg-blue-700 rounded-md"
        >
          <ChevronLeft size={24} />
        </button>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = (location.pathname === item.path) || 
                              ((location.pathname === FRONTEND_PAGES.REGISTER) && (item.path === FRONTEND_PAGES.LOGIN))
              
              const commonClasses = `flex items-center space-x-3 p-3 rounded-md transition-colors ${
                  isActive 
                      ? 'bg-blue-700 text-white' 
                      : 'hover:bg-blue-700 text-blue-100'
              }`

              if (item.path !== FRONTEND_PAGES.LOGOUT) {
                  return (
                      <li key={item.path}>
                          <Link to={item.path} className={commonClasses}>
                              <Icon size={20} />
                              <span>{item.label}</span>
                          </Link>
                      </li>
                  )
              }
              
              return (
                  <li key={item.path}>
                      <button
                          onClick={handleLogout}
                          className={`${commonClasses} w-full text-left`}
                      >
                          <Icon size={20} />
                          <span>{item.label}</span>
                      </button>
                  </li>
              )
          })}
      </ul>
      </nav>
    </div>
  )
}