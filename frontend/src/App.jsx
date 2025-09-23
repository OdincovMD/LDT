import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Register from './pages/Register'
import Login from './pages/Login'
import { useDispatch, useSelector } from 'react-redux'

import { ENDPOINTS, PAGE_NAMES } from "./imports/ENDPOINTS"
import { setCurrentPage } from './store/appSlice'

function App() {

  const dispatch = useDispatch()
  const user = useSelector(state => state.app.user)

  useEffect(() => {
    if (user) {
      dispatch(setCurrentPage(PAGE_NAMES.HOME))
    } else {
      dispatch(setCurrentPage(PAGE_NAMES.LOGIN))
    }
  }, [dispatch, user])

  return (
    <Layout>
      <Routes>
        <Route path={ENDPOINTS.LOGIN} element={<Login />} />
        <Route path={ENDPOINTS.REGISTER} element={<Register />} />

          <Route index element={<Home />} />
          <Route path={ENDPOINTS.ABOUT.slice(1)} element={<About />} />
          <Route path={ENDPOINTS.CONTACT.slice(1)} element={<Contact />} />

        <Route path="*" element={<Navigate to={ENDPOINTS.HOME} />} />
      </Routes>
    </Layout>
  )
}

export default App