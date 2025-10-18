/**
 * @component About
 * @description Страница "О нас". Содержит информацию о команде разработчиков и проекте для хакатона "Лидеры Цифровой Трансформации 2025".
 */
import { useState } from 'react'
import { ChevronDown, ChevronUp, Trophy, Users, GraduationCap, ExternalLink } from 'lucide-react'

export default function About() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">О проекте</h1>
        <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
      </div>

      {/* Основная информация */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trophy className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Хакатон «Лидеры Цифровой Трансформации 2025»
            </h2>
            <p className="text-gray-700 font-medium">
              Задача 3 • Команда №32 «Дядя Бао»
            </p>
          </div>
        </div>
      </div>

      {/* Команда */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="text-green-600" size={24} />
          <h2 className="text-2xl font-semibold text-gray-900">Наша команда</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TeamMember
            initial="М"
            color="bg-blue-500"
            name="Одинцов Михаил Дмитриевич"
            telegram="@hardbox1"
            telegramUrl="https://t.me/hardbox1"
          />
          <TeamMember
            initial="Н"
            color="bg-green-500"
            name="Кегелик Николай Александрович"
            telegram="@horokami"
            telegramUrl="https://t.me/horokami"
          />
          <TeamMember
            initial="В"
            color="bg-purple-500"
            name="Сухинин Виталий Максимович"
            telegram="@LLL_botik"
            telegramUrl="https://t.me/LLL_botik"
          />
        </div>
      </div>

      {/* Дополнительная информация с аккордеоном */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-3">
            <GraduationCap className="text-orange-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">Об образовании</h3>
          </div>
          {expanded ? (
            <ChevronUp className="text-gray-500" size={20} />
          ) : (
            <ChevronDown className="text-gray-500" size={20} />
          )}
        </button>

        {expanded && (
          <div className="mt-4 pl-11">
            <p className="text-gray-700 leading-relaxed">
              Разработчики — студенты кафедры №46 «Компьютерные медицинские системы» 
              Национального исследовательского ядерного университета «МИФИ».
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Свяжитесь с нами для обсуждения проекта и сотрудничества
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TeamMember({ initial, color, name, telegram, telegramUrl }) {
  return (
    <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
      <div className={`w-16 h-16 ${color} rounded-full mx-auto mb-3 flex items-center justify-center`}>
        <span className="text-white font-bold text-xl">{initial}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3 leading-tight">
        {name}
      </h3>
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
          alt="Telegram"
          className="w-4 h-4 mr-2"
        />
        <span className="text-sm">{telegram}</span>
        <ExternalLink size={12} className="ml-1 text-gray-500" />
      </a>
    </div>
  )
}