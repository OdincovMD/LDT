/**
 * @component SystemGuide
 * @description Страница с инструкциями по подключению к системе мониторинга. Содержит руководства для разных режимов работы.
 */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Wifi, Usb, Play, Copy, Upload, ChevronDown, ChevronUp } from 'lucide-react'

import { FRONTEND_PAGES } from "../imports/ENDPOINTS"

export default function SystemGuide() {
  const [expandedSections, setExpandedSections] = useState({
    demo: false,
    websocket: false,
    usb: false
  })

    /**
   * Миниатюрная кнопка режима записи для вставки в текст
   */
  const MiniRecordButton = ({ className = "" }) => {
    return (
      <span
        className={`inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 px-2 py-1 rounded-lg text-white font-semibold text-xs ${className}`}
      >
        <Play size={10} className="text-white" />
        <span>Начать запись</span>
      </span>
    )
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto p-6">
      {/* Хедер */}
      <div className="flex items-center mb-8">
        <Link
          to={FRONTEND_PAGES.DASHBOARD}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          К мониторингу
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Инструкция по подключению</h1>
      </div>

      {/* Введение */}
      {/* <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">Общая информация</h2>
        <p className="text-blue-800">
          Система поддерживает три режима работы: <span className="font-semibold">демо-данные</span>,{" "}
          <span className="font-semibold">WebSocket-подключение</span> и <span className="font-semibold">USB-мост</span>.
        </p>
      </div> */}

      <div className="space-y-8">
      {/* Демо-режим */}
      <section className="border border-gray-300 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('demo')}
          className="w-full p-6 text-left transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <Play size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Демо-режим</h3>
                <p className="text-gray-600">
                  <span className="italic">
                    Демонстрация работы модели
                    {/* <br/>Можно использовать <span className="font-medium">свой CSV-набор</span> или
                    демонстрационный набор данных по умолчанию, если файл не загружен. */}
                  </span>
                </p>
              </div>
            </div>
            {expandedSections.demo ? (
              <ChevronUp size={24} className="text-gray-400" />
            ) : (
              <ChevronDown size={24} className="text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.demo && (
          <div className="px-6 pb-6">

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Требования к пользовательскому файлу:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Формат: <span className="font-medium">CSV</span> (разделитель определяется автоматически)</li>
                <li>Обязательные колонки в заголовке: <code className="bg-gray-100 px-1 rounded">t</code>, <code className="bg-gray-100 px-1 rounded">bpm</code>, <code className="bg-gray-100 px-1 rounded">uc</code></li>
                <li>Размер файла ограничен (40 Мб)</li>
              </ul>
            </div>

            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Как использовать:</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Выберите пациента и исследование на вкладке <span className="font-medium">«Система»</span></li>
                <li>Выберите режим <span className="font-medium">«Демо»</span></li>
                <li className="flex items-start">
                  <Upload size={18} className="mt-1 mr-2 text-gray-500 flex-shrink-0" />
                  <span>
                    <span className="font-medium">Опционально:</span> нажмите кнопку
                    <span className="font-medium"> «Загрузить файл»</span>
                    <span className='italic'>
                      (рядом с <span className="font-medium ">«Подключиться»</span>)
                    </span> и выберите свой CSV. <br/>
                    Если файл не загружен, система использует <span className="font-medium">набор данных по умолчанию</span>
                  </span>
                </li>
                <li>Нажмите <span className="font-medium">«Подключиться»</span></li>
                <li>Нажмите кнопку <MiniRecordButton className="ml-1 mr-1" /></li>
                <li>Наблюдайте сигналы ЧСС/МА и кривую вероятности развития гипоксии</li>
              </ol>
            </div>

            
          </div>
        )}
      </section>

      {/* WebSocket подключение */}
      <section className="border border-gray-300 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('websocket')}
          className="w-full p-6 text-left transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Wifi size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">WebSocket</h3>
                <p className="text-gray-600">
                  <span className="italic">
                    Для датчиков с доступом в интернет или в одной локальной сети с системой
                  </span>
                </p>
              </div>
            </div>
            {expandedSections.websocket ? (
              <ChevronUp size={24} className="text-gray-400" />
            ) : (
              <ChevronDown size={24} className="text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.websocket && (
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Требования:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Датчик/устройство с поддержкой WebSocket</li>
                <li>Доступ к серверу (интернет или одна локальная сеть)</li>
                <li>Формат передаваемых данных: JSON</li>
              </ul>
            </div>

            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Как использовать:</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Выберите пациента и исследование на вкладке <span className="font-medium">«Система»</span></li>
                <li>Выберите режим <span className="font-medium">«WebSocket»</span></li>
                <li>Нажмите <span className="font-medium">«Подключиться»</span> — система сгенерирует URL для подключения</li>
                <li>
                  Нажмите <Copy size={16} className="inline" />, чтобы скопировать URL, и вставьте его в настройки датчика
                </li>
                <li>На датчике начните отправку JSON-пакетов с датчика по указанному адресу</li>
                <li>Наблюдайте сигналы ЧСС/МА и кривую вероятности развития гипоксии</li>
              </ol>

              <div className="mt-3 text-sm text-gray-600">
                Пример сгенерированного URL:<br/>
                <code className="bg-white border px-2 py-1 rounded">
                  ws://localhost:90/ws/case/22?token=Wt2nbmQm68ievs376CHqxIg0DupE6Ex5FlraHrG_ON4&H=5&stride=1
                </code>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* USB-мост */}
      <section className="border border-gray-300 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('usb')}
          className="w-full p-6 text-left transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <Usb size={24} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">USB-мост</h3>
                <p className="text-gray-600">
                  <span className="italic">
                    Для оборудования без WebSocket
                    {/* <br/> Мост читает прибор по USB-COM и передаёт сигналы напрямую в систему. */}
                  </span>
                </p>
              </div>
            </div>
            {expandedSections.usb ? (
              <ChevronUp size={24} className="text-gray-400" />
            ) : (
              <ChevronDown size={24} className="text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.usb && (
          <div className="px-6 pb-6">
            {/* Требования */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Требования:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>ОС: Windows / Linux / macOS</li>
                <li>Свободный USB-порт и установленный драйвер прибора (если требуется)</li>
                <li>Доступ к серверу системы (локальная сеть или интернет)</li>
              </ul>
            </div>

            {/* Как использовать*/}
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Как использовать:</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Выберите пациента и исследование на вкладке <span className="font-medium">«Система»</span></li>
                <li>Выберите режим <span className="font-medium">«USB»</span></li>
                <li>Нажмите <span className="font-medium">«Подключиться»</span> — система подготовит приём данных</li>
                <li>Скачайте и запустите программу <span className="font-medium">«USB-мост»</span> на компьютере</li>
                <li>Подключите прибор по USB и выберите его порт:
                  <ul className="list-disc list-inside ml-6 mt-1 text-sm text-gray-700">
                    <li><span className="font-medium">Windows:</span> <code>COM3</code>, <code>COM4</code> и т.п.</li>
                    <li><span className="font-medium">Linux:</span> <code>/dev/ttyUSB0</code>, <code>/dev/ttyACM0</code> и т.п.</li>
                    <li><span className="font-medium">macOS:</span> <code>/dev/tty.usbserial-*</code>, <code>/dev/tty.usbmodem-*</code></li>
                  </ul>
                </li>
                <li>В окне моста нажмите <span className="font-medium">Start</span></li>
                <li>Наблюдайте сигналы ЧСС/МА и кривую вероятности развития гипоксии</li>
              </ol>
            </div>

            {/* Подсказки по ОС и правам */}
            <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-lg">
              <h4 className="font-medium text-violet-900 mb-2">Полезно знать:</h4>
              <ul className="list-disc list-inside space-y-1 text-violet-800 text-sm">
                <li><span className="font-medium">Linux:</span> если порт недоступен — добавьте пользователя в группу <code>dialout</code> и войдите заново</li>
                <li><span className="font-medium">Windows:</span> при первом подключении дождитесь установки драйвера (Диспетчер устройств → Порты (COM & LPT))</li>
                <li><span className="font-medium">macOS:</span> при запросе безопасности разрешите доступ приложению к USB/серийному порту</li>
                <li>Если мост видит несколько портов — выберите из списка. При отсутствии списка укажите путь вручную в настройках</li>
              </ul>
            </div>

            {/* Диагностика */}
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Если данных нет:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li>Проверьте, что прибор включён и выбран верный порт</li>
                <li>Попробуйте другой USB-кабель/порт на компьютере</li>
                <li>Закройте другие программы, которые могут занять порт (например, терминалы)</li>
                <li>Перезапустите «USB-мост» и нажмите <span className="font-medium">Start</span> ещё раз</li>
              </ul>
            </div>
          </div>
        )}
      </section>

        {/* Поддержка */}
        <section className="border border-gray-300 rounded-2xl p-6 bg-gray-50">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Нужна помощь?</h3>
          <div className="space-y-3 text-gray-700">
            <p>Если у вас возникли проблемы с подключением:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Проверьте сетевое подключение</li>
              <li>Убедитесь, что оборудование поддерживает выбранный режим</li>
              <li>Проверьте правильность формата передаваемых данных</li>
              <li>Обратитесь к технической документации вашего оборудования</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </div>
  )
}