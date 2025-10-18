/**
 * @component Home
 * @description Главная страница приложения. Содержит информацию о системе мониторинга состояния плода, технические детали и возможности платформы.
 */
import { useSelector } from "react-redux"
import { User, Mail, Activity, Heart, AlertTriangle, Shield, Cpu, BarChart3 } from "lucide-react"

export default function Home() {
  const user = useSelector((state) => state.app.user)
  const loading = useSelector((state) => state.app.loading)

  // Если данные еще загружаются
  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Если пользователь авторизован — блок с аккаунтом */}
      {user && (
        <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="mx-auto w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <User className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Добро пожаловать, {user.name}!
            </h2>
            <p className="text-gray-600">Ваш профиль в системе мониторинга состояния плода</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <User size={18} className="text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-800 font-medium">ФИО</p>
                <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Mail size={18} className="text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Email</p>
                <p className="font-semibold text-gray-900 text-sm">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Информация о системе */}
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Activity className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Система интеллектуального мониторинга и прогнозирования состояния плода
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-4xl mx-auto">
            Инновационная платформа для непрерывного мониторинга и предиктивной аналитики состояния плода
            в режиме реального времени. Наша система объединяет передовые достижения в области анализа медицинских
            данных, машинного обучения и искусственного интеллекта для обеспечения максимальной точности
            автоматической интерпретации кардиотокографических сигналов.
          </p>
        </div>

        {/* Основные возможности */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-100 ">
            <div className="mx-auto w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <Activity className="text-white" size={28} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-3 ">Автоматическая классификация паттернов КТГ</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
                Классификация сигналов КТГ в соответствии с международными клиническими стандартами FIGO.
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="mx-auto w-14 h-14 bg-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-white" size={28} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Раннее выявление острой гипоксии</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
                Продвинутые алгоритмы детекции ранних признаков кислородной недостаточности плода.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="mx-auto w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center mb-4">
              <Heart className="text-white" size={28} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Прогнозирование метаболического ацидоза</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
                Валидация прогностических алгоритмов на основе объективных лабораторных данных.
            </p>
          </div>
        </div>

        {/* Технические детали */}
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center mb-4">
              <Shield className="text-blue-600 mr-3" size={28} />
              <h3 className="text-2xl font-bold text-gray-900">Стандарты FIGO в основе системы</h3>
            </div>
            <p className="text-gray-700 mb-4 leading-relaxed">
              В основе аналитических алгоритмов системы лежат строгие критерии Международной федерации гинекологии и акушерства (FIGO),
              представляющие собой стандартизированные правила клинической интерпретации кардиотокограмм.
              Мы реализовали комплексный анализ четырех ключевых параметров:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                  <span><strong>Базальный ритм</strong> - средняя частота сердечных сокращений плода</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                  <span><strong>Вариабельность</strong> - колебания ЧСС вокруг базального уровня</span>
                </li>
              </ul>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                  <span><strong>Деселерации</strong> - вариабельные, поздние и пролонгированные снижения ЧСС</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                  <span><strong>Акцелерации</strong> - временные увеличения ЧСС</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-300">
              <div className="flex items-center mb-4">
                <Cpu className="text-green-600 mr-3" size={24} />
                <h4 className="font-bold text-gray-900 text-lg">Продвинутые алгоритмы детекции событий</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Детекция схваток</h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Используем робастные статистические методы для идентификации схваток на сигнале тонуса матки.
                    Алгоритм вычисляет медиану и медианное абсолютное отклонение (MAD) для устойчивой оценки базового уровня,
                    затем применяет пик-детекцию с адаптивными порогами, учитывающими индивидуальные особенности сигнала.
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Детекция деселераций</h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Система анализирует сигнал ЧСС плода относительно вычисленного базового уровня и обнаруженных схваток.
                    Для каждого эпизода снижения ЧСС определяются характеристики: глубина, длительность, временная связь со схватками,
                    что позволяет точно классифицировать деселерации по типам FIGO.
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Детекция акцелераций</h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Алгоритм идентифицирует эпизоды повышения ЧСС, связанные с двигательной активностью плода.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-300">
              <div className="flex items-center mb-4">
                <BarChart3 className="text-purple-600 mr-3" size={24} />
                <h4 className="font-bold text-gray-900 text-lg">Комплексная система оценки рисков</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Критерии высокого риска</h5>
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Высокий риск</strong> регистрируется при наличии одного или нескольких критериев:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-2"></div>
                      <span>Наличие хотя бы одной пролонгированной деселерации (продолжительность ≥2 минут)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-2"></div>
                      <span>Двух и более поздних деселераций за последние 5 минут мониторинга</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-2"></div>
                      <span>Низкая вариабельность ЧСС (амплитуда ≤5 уд/мин) в течение большей части времени мониторинга</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-2"></div>
                      <span>Тахикардии (ЧСС &gt;160 уд/мин) или брадикардии (ЧСС &lt;110 уд/мин), занимающих ≥30% времени анализа</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Дополнительные признаки для повышения устойчивости</h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Для повышения надежности прогнозирования система извлекает расширенный набор признаков, включая
                    статистические характеристики, показатели вариабельности сердечного ритма, и динамические характеристики.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h4 className="font-bold text-gray-900 text-xl mb-4">Сситема прогнозирования</h4>
            <p className="text-gray-700 leading-relaxed">
              Наша модель работает по принципу <strong>скользящего временного окна</strong>: по комплексным признакам,
              извлеченным из текущего временного интервала мониторинга, система прогнозирует вероятность развития
              патологического состояния в следующем временном горизонте.
            </p>
            <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
              <p className="text-sm text-green-800 font-medium">
                <strong>Преимущество:</strong> Прогнозирование с упреждением позволяет предотвратить развитие
                критических состояний, а не просто констатировать их наличие.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}