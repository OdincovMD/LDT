export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Добро пожаловать на главную страницу!</h2>
        <p className="text-gray-600 mb-4">
          Это демонстрационная страница с использованием React Router и Redux.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">React Router</h3>
            <p className="text-sm">Маршрутизация между страницами</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Redux</h3>
            <p className="text-sm">Управление состоянием приложения</p>
          </div>
        </div>
      </div>
    </div>
  )
}