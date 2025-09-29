import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import { useSelector } from 'react-redux'

import { FRONTEND_PAGES } from "./imports/ENDPOINTS"

function App() {

  const user = useSelector(state => state.app.user)

  return (
    <Layout>
      <Routes>
        <Route path={FRONTEND_PAGES.LOGIN} element={!user ? <Login /> : <Navigate to={FRONTEND_PAGES.HOME} />} />
        <Route path={FRONTEND_PAGES.REGISTER} element={!user ? <Register /> : <Navigate to={FRONTEND_PAGES.HOME} />} />

          <Route index element={<Home />} />
          <Route path={FRONTEND_PAGES.ABOUT.slice(1)} element={<About />} />
          <Route path={FRONTEND_PAGES.DASHBOARD.slice(1)} element={user ? <Dashboard /> : <Navigate to={FRONTEND_PAGES.HOME} />} />
          <Route path={FRONTEND_PAGES.PATIENTS.slice(1)} element={<Patients />} />

        <Route path="*" element={<Navigate to={FRONTEND_PAGES.HOME} />} />
      </Routes>
    </Layout>
  )
}

export default App