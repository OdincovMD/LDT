import { useSelector, useDispatch } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home,
  LogIn,
  User, 
  Mail, 
  ChevronLeft,
  Monitor
} from 'lucide-react'

import { ENDPOINTS, PAGE_NAMES } from "../imports/ENDPOINTS"
import { toggleSidebar } from '../store/appSlice'

export default function Sidebar({ isOpen }) {
  const dispatch = useDispatch()
  const location = useLocation()

  const user = useSelector(state => state.app.user)

  const baseMenuItems = [
    { path: ENDPOINTS.HOME, label: 'Главная', icon: Home },
    { path: ENDPOINTS.ABOUT, label: 'О нас', icon: User },
    { path: ENDPOINTS.CONTACT, label: 'Контакты', icon: Mail }
  ]

  const authMenuItems = [
    { path: ENDPOINTS.DASHBOARD, label: 'Система', icon: Monitor } // ← Добавляем
  ]

  const unauthMenuItems = [
    { path: ENDPOINTS.LOGIN, label: 'Войти', icon: LogIn },
  ]

  const menuItems = [
    ...baseMenuItems,
    ...(user ? authMenuItems : []),
    ...(!user ? unauthMenuItems : [])
  ]

  const handleNavigate = (path) => {
    const pageName = path === ENDPOINTS.HOME ? PAGE_NAMES.HOME : path.slice(1)
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
            const isActive = (location.pathname === item.path) || ((location.pathname === ENDPOINTS.REGISTER) && (item.path === ENDPOINTS.LOGIN))
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-blue-700 text-white' 
                      : 'hover:bg-blue-700 text-blue-100'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}