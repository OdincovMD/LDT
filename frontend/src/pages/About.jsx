/**
 * @component About
 * @description Страница "О нас". Содержит информацию о команде разработчиков и проекте для хакатона "Лидеры Цифровой Трансформации 2025".
 */
export default function About() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">О нас</h2>

        <div className="space-y-4 text-gray-600 mb-8">
          <p className="leading-relaxed">
            Система создана для Хакатона <span className="font-medium">«Лидеры Цифровой Трансформации 2025»</span> (Задача 3).
          </p>

          <p className="leading-relaxed font-semibold text-gray-700">
            Команда №32 «Дядя Бао»
          </p>

          <p className="leading-relaxed">
            Разработчики — студенты кафедры «Компьютерные медицинские системы» НИЯУ МИФИ.
          </p>
        </div>

        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Наша команда</h3>
        <p className="text-gray-600 mb-6">Свяжитесь с нами для обсуждения проекта.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white font-bold text-xl">М</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Одинцов Михаил<br/>Дмитриевич</h3>
            <a
              href="https://t.me/hardbox1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
                alt="Telegram"
                className="w-5 h-5 mr-2"
              />
              @hardbox1
            </a>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white font-bold text-xl">Н</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Кегелик Николай Александрович</h3>
            <a
              href="https://t.me/horokami"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
                alt="Telegram"
                className="w-5 h-5 mr-2"
              />
              @horokami
            </a>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white font-bold text-xl">В</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Сухинин Виталий Максимович</h3>
            <a
              href="https://t.me/LLL_botik"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
                alt="Telegram"
                className="w-5 h-5 mr-2"
              />
              @LLL_botik
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}