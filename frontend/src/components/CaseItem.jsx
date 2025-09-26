import React from 'react'
import { Link } from 'react-router-dom'
import { Activity, Calendar, BarChart3, Play } from 'lucide-react'

const CaseItem = ({ caseItem, patientId }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCaseStatus = (caseData) => {
    if (caseData.predictions && caseData.predictions.length > 0) {
      return 'Завершено'
    }
    if (caseData.raw_signals && caseData.raw_signals.length > 0) {
      return 'В процессе'
    }
    return 'Новое'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Завершено': return 'bg-green-100 text-green-800'
      case 'В процессе': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const status = getCaseStatus(caseItem)

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Activity size={16} className="text-blue-600" />
        </div>
        
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">
              {caseItem.description || `Исследование #${caseItem.id}`}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <div className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>{formatDate(caseItem.created_at)}</span>
            </div>
            {caseItem.raw_signals && (
              <div className="flex items-center space-x-1">
                <BarChart3 size={12} />
                <span>{caseItem.raw_signals.length} записей</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Link
        to={`/dashboard?patientId=${patientId}&caseId=${caseItem.id}`}
        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
      >
        <Play size={16} />
        <span>Открыть</span>
      </Link>
    </div>
  )
}

export default CaseItem