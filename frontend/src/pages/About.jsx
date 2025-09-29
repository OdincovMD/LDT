export default function About() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">О нас</h2>

        <div className="space-y-4 text-gray-600">
          <p className="leading-relaxed">
            Приложение сделано для Хакатона Лидеры Цифровой Трансформации 2025 (Задача 3)
          </p>

          <p className="leading-relaxed font-semibold text-gray-700">
            Команда №32 «Дядя Бао»
          </p>

          <p className="leading-relaxed">
            Команда разработчиков – студенты кафедры «Компьютерные медицинские системы» НИЯУ МИФИ
          </p>

        </div>
      </div>
    </div>
  )
}