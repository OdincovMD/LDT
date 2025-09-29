export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Контакты</h2>
        <p className="text-gray-600 mb-4">
          Свяжитесь с нами для сотрудничества.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white font-bold text-xl">М</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Одинцов Михаил Дмитриевич</h3>
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

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white font-bold text-xl">Н</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Кегелик Николай Александрович</h3>
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

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white font-bold text-xl">В</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Сухинин Виталий Максимович</h3>
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