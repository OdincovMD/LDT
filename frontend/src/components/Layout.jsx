import { useSelector, useDispatch } from 'react-redux'
import Sidebar from './Sidebar'
import Header from './Header'
import { toggleSidebar } from '../store/appSlice'

export default function Layout({ children }) {
  const sidebarOpen = useSelector(state => state.app.sidebarOpen)
  const dispatch = useDispatch()

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar())
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
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