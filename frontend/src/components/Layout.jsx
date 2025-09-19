import { useSelector, useDispatch } from 'react-redux'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  const sidebarOpen = useSelector(state => state.app.sidebarOpen)
  const dispatch = useDispatch()

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onToggleSidebar={toggleSidebar} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} />
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}