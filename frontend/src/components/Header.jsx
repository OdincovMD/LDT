/**
 * @component Header
 * @description Шапка приложения. Отображает заголовок текущей страницы, информацию о пользователе и кнопку выхода.
 */
// src/components/Header.jsx
import React, { useMemo, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { LogOut, UserCircle } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"

import { FRONTEND_PAGES, PAGE_NAMES } from "../imports/ENDPOINTS"
import { logout } from "../store/appSlice"

export default function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const user = useSelector((state) => state.app.user)
  const sidebarOpen = useSelector((state) => state.app.sidebarOpen)

  const pageTitles = {
    [PAGE_NAMES.HOME]: "Главная",
    [PAGE_NAMES.PATIENTS]: "Мои пациенты",
    [PAGE_NAMES.DASHBOARD]: "Система мониторинга",
    [PAGE_NAMES.ABOUT]: "О нас",
    [PAGE_NAMES.LOGIN]: "Вход в систему",
    [PAGE_NAMES.REGISTER]: "Регистрация аккаунта",
     [PAGE_NAMES.SYSTEM_GUIDE]: "Инструкция по подключению"
  }

  const pageDescriptions = {
    [PAGE_NAMES.PATIENTS]: "Управление пациентами и их исследованиями",
    [PAGE_NAMES.DASHBOARD]: "Мониторинг в реальном времени",
    [PAGE_NAMES.ABOUT]: "Информация о нашем проекте и команде",
    [PAGE_NAMES.LOGIN]: "Введите ваши учетные данные",
    [PAGE_NAMES.REGISTER]: "Создайте новый аккаунт",
    [PAGE_NAMES.SYSTEM_GUIDE]: "Руководство по подключению оборудования"
  }

  const currentPageName = useMemo(() => {
    const path = location.pathname

    // точные совпадения
    const exactMap = new Map([
      [FRONTEND_PAGES.HOME, PAGE_NAMES.HOME],
      [FRONTEND_PAGES.PATIENTS, PAGE_NAMES.PATIENTS],
      [FRONTEND_PAGES.ABOUT, PAGE_NAMES.ABOUT],
      [FRONTEND_PAGES.LOGIN, PAGE_NAMES.LOGIN],
      [FRONTEND_PAGES.REGISTER, PAGE_NAMES.REGISTER],
      [FRONTEND_PAGES.SYSTEM_GUIDE, PAGE_NAMES.SYSTEM_GUIDE]
    ])
    if (exactMap.has(path)) return exactMap.get(path)

    // вложенные роуты дашборда: /dashboard/*
    if (path.startsWith(FRONTEND_PAGES.DASHBOARD)) return PAGE_NAMES.DASHBOARD

    return PAGE_NAMES.HOME
  }, [location.pathname])

  const pageTitle = pageTitles[currentPageName] || "Мониторинг системы"
  const pageDescription = pageDescriptions[currentPageName] || ""

  const handleLogout = useCallback(() => {
    dispatch(logout())
    // на всякий случай чистим локальное хранилище токена, если ты его там кладёшь
    try {
      localStorage.removeItem("accessToken")
    } catch {}
    navigate(FRONTEND_PAGES.LOGIN, { replace: true })
  }, [dispatch, navigate])

  return (
    <header className="bg-white shadow-sm border-b border-gray-300">
      <div
        className={`transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-16"}`}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Левая часть — заголовок страницы */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
              {pageDescription && (
                <p className="text-gray-600 text-sm mt-1">{pageDescription}</p>
              )}
            </div>

            {/* Правая часть — пользователь и выход */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>

                  <div
                    className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                    aria-label="Профиль пользователя"
                    title="Профиль пользователя"
                  >
                    <UserCircle size={20} className="text-white" />
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center space-x-2 text-sm text-gray-600"
                  aria-label="Гость"
                >
                  <UserCircle size={20} />
                  <span>Гость</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
