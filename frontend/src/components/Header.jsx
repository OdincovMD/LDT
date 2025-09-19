import { useSelector } from 'react-redux'
import { Menu } from 'lucide-react'

export default function Header({ onToggleSidebar }) {
  const currentPage = useSelector(state => state.app.currentPage)

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 capitalize">
            {currentPage}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Добро пожаловать!</span>
        </div>
      </div>
    </header>
  )
}