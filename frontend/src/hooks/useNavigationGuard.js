/**
 * @hook useNavigationGuard
 * @description Хук для защиты от потери несохраненных данных. Предупреждает пользователя при попытке уйти со страницы с несохраненными изменениями.
 */
// hooks/useNavigationGuard.js
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export const useNavigationGuard = (hasUnsavedChanges) => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?'
      }
    }

    const handleClick = (e) => {
      if (hasUnsavedChanges) {
        const isExternalLink = e.target.href && !e.target.href.includes(window.location.origin)
        if (isExternalLink) {
          if (!confirm('У вас есть несохраненные изменения. Вы уверены, что хотите уйти?')) {
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleClick)
    }
  }, [hasUnsavedChanges])

  return null
}