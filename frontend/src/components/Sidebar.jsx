import { useSelector, useDispatch } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  User, 
  Mail, 
  ChevronLeft 
} from 'lucide-react'

export default function Sidebar({ isOpen }) {
  const dispatch = useDispatch()
  const location = useLocation()

  const menuItems = [
    { path: '/', label: 'Главная', icon: Home },
    { path: '/about', label: 'О нас', icon: User },
    { path: '/contact', label: 'Контакты', icon: Mail }
  ]

  const handleNavigate = (path) => {
    const pageName = path === '/' ? 'home' : path.slice(1)
    dispatch({ type: 'SET_CURRENT_PAGE', payload: pageName })
  }

  if (!isOpen) {
    return (
      <div className="w-16 bg-blue-600 min-h-screen fixed left-0 top-0 z-40">
        <div className="p-4">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
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
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="p-2 hover:bg-blue-700 rounded-md"
        >
          <ChevronLeft size={24} />
        </button>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
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