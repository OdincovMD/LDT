import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { useSelector } from 'react-redux'

import { ENDPOINTS } from "./imports/ENDPOINTS"

function App() {

  const user = useSelector(state => state.app.user)

  return (
    <Layout>
      <Routes>
        <Route path={ENDPOINTS.LOGIN} element={!user ? <Login /> : <Navigate to={ENDPOINTS.HOME} />} />
        <Route path={ENDPOINTS.REGISTER} element={!user ? <Register /> : <Navigate to={ENDPOINTS.HOME} />} />

          <Route index element={<Home />} />
          <Route path={ENDPOINTS.ABOUT.slice(1)} element={<About />} />
          <Route path={ENDPOINTS.CONTACT.slice(1)} element={<Contact />} />
          <Route path={ENDPOINTS.DASHBOARD.slice(1)} element={user ? <Dashboard /> : <Navigate to={ENDPOINTS.HOME} />} />

        <Route path="*" element={<Navigate to={ENDPOINTS.HOME} />} />
      </Routes>
    </Layout>
  )
}

export default App