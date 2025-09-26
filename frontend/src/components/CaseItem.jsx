import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Activity, Calendar, BarChart3, Play } from 'lucide-react'

const CaseItem = ({ caseId }) => {

  const cases = useSelector(state => state.cases)

  const the_case = cases.cases.filter(
    case_ => case_.id === caseId
  )[0]

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Activity size={16} className="text-blue-600" />
        </div>
        
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">
              {the_case.description || `Исследование #${the_case.id}`}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <div className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>{formatDate(the_case.created_at)}</span>
            </div>
            {the_case.raw_signals && (
              <div className="flex items-center space-x-1">
                <BarChart3 size={12} />
                <span>{the_case.raw_signals.length} записей</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Link
        to={`/dashboard`}
        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
      >
        <Play size={16} />
        <span>Открыть</span>
      </Link>
    </div>
  )
}

export default CaseItem