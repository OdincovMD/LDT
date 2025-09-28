// pages/Dashboard.jsx
import React, { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigationGuard } from "../hooks/useNavigationGuard"
import CaseSelector from "../components/CaseSelector"
import ModeSelector from "../components/ModeSelector"
import RecordingControls from "../components/RecordingControls"
import RealtimeLineChart from "../components/RealtimeLineChart"
import { 
  startSimulation, 
  stopSimulation, 
  loadHistoricalData, 
  fetchLatestDataPoint, 
  fetchPredictions,
  checkCaseHasData // ДОБАВЛЕНО
} from "../asyncActions/stream"
import { 
  addDataPoint, 
  setHistoricalData, 
  clearData, 
  setOperationMode, 
  setSimulationStatus,
  setCaseHasData // ДОБАВЛЕНО
} from "../store/streamSlice"

// Константы
const MAX_SECONDS = 60 * 5
const ANIMATION_INTERVAL_MS = 50

function Dashboard() {
  const dispatch = useDispatch()
  const { 
    currentCase, 
    currentPatient, 
    operationMode, 
    recordingMode, 
    hasUnsavedChanges, 
    dataPoints, 
    historicalData,
    isSimulating,
    caseHasData // ДОБАВЛЕНО
  } = useSelector(state => state.stream)
  const { user } = useSelector(state => state.app)
  
  const [rawPoints, setRawPoints] = useState([])
  const [interpolatedPoints, setInterpolatedPoints] = useState([])
  const [currentTimeWindow, setCurrentTimeWindow] = useState([0, MAX_SECONDS])
  const [initialPhase, setInitialPhase] = useState(true)

  const timerRef = useRef(null)
  const animationRef = useRef(null)
  const startTimeRef = useRef(null)

  // Защита навигации
  useNavigationGuard(hasUnsavedChanges)

  // Функция для парсинга времени
  const parseTs = (t) => typeof t === 'string' ? new Date(t).getTime() / 1000 : t

  // Линейная интерполяция между двумя точками
  const interpolatePoints = (pointA, pointB, ratio) => {
    if (!pointA || !pointB) return pointB || pointA

    return {
      t: pointA.t + (pointB.t - pointA.t) * ratio,
      bpm: pointA.bpm + (pointB.bpm - pointA.bpm) * ratio,
      uc: pointA.uc + (pointB.uc - pointA.uc) * ratio,
      risk: pointA.risk + (pointB.risk - pointA.risk) * ratio,
    }
  }

  // Добавление новой точки данных
  const pushPoint = (newPoint) => {
    setRawPoints(prev => {
      const updated = [...prev, newPoint]

      if (!startTimeRef.current) {
        startTimeRef.current = newPoint.t
        setCurrentTimeWindow([startTimeRef.current, startTimeRef.current + MAX_SECONDS])
      }

      if (operationMode === 'simulation' && recordingMode === 'recording') {
        dispatch(addDataPoint(newPoint))
      }

      return updated
    })
  }

  // Функция интерполяции и обновления графика
  const updateInterpolatedData = () => {
    if (rawPoints.length < 1) {
      setInterpolatedPoints(rawPoints)
      return
    }

    const now = Date.now() / 1000
    const latestPoint = rawPoints[rawPoints.length - 1]

    let interpolatedPoint = latestPoint

    if (rawPoints.length >= 2 && now - latestPoint.t < 2) {
      const prevPoint = rawPoints[rawPoints.length - 2]
      const timeSinceLastPoint = now - latestPoint.t
      const timeBetweenPoints = latestPoint.t - prevPoint.t

      const ratio = Math.min(1, timeSinceLastPoint / Math.max(0.1, timeBetweenPoints))
      interpolatedPoint = interpolatePoints(prevPoint, latestPoint, ratio)
    }

    const basePoints = rawPoints.slice(0, -1)
    setInterpolatedPoints([...basePoints, interpolatedPoint])

    const currentTime = now
    
    if (operationMode === 'simulation' && recordingMode === 'recording') {
      if (initialPhase) {
        const elapsedTime = currentTime - startTimeRef.current
        if (elapsedTime <= MAX_SECONDS) {
          setCurrentTimeWindow([startTimeRef.current, startTimeRef.current + MAX_SECONDS])
        } else {
          setInitialPhase(false)
          const windowStart = currentTime - MAX_SECONDS
          setCurrentTimeWindow([windowStart, currentTime])
        }
      } else {
        const windowStart = currentTime - MAX_SECONDS
        setCurrentTimeWindow([windowStart, currentTime])
      }
    }
  }

  // Очистка данных
  const clearChartData = () => {
    setRawPoints([])
    setInterpolatedPoints([])
    setCurrentTimeWindow([0, MAX_SECONDS])
    setInitialPhase(true)
    startTimeRef.current = null
    dispatch(clearData())
  }

  // Отслеживание alert
  useEffect(() => {
    if (rawPoints.at(-1)?.alert === 1) {
      alert(`Внимание, обнаружена высокая вероятность гипоксии! Время: ${rawPoints.at(-1)?.timestamp}`)
    }
  }, [rawPoints])

  // Запуск/остановка анимации
  useEffect(() => {
    if ((operationMode === 'simulation' && recordingMode === 'recording') && rawPoints.length > 0) {
      animationRef.current = setInterval(updateInterpolatedData, ANIMATION_INTERVAL_MS)
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current)
        animationRef.current = null
      }
      setInterpolatedPoints(rawPoints)
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
        animationRef.current = null
      }
    }
  }, [operationMode, recordingMode, rawPoints.length, initialPhase])

  // ПРОВЕРКА НАЛИЧИЯ ДАННЫХ В КЕЙСЕ ПРИ ЕГО ВЫБОРЕ
  useEffect(() => {
    const checkData = async () => {
      if (currentCase) {
        try {
          const hasData = await dispatch(checkCaseHasData(currentCase.id)).unwrap()
          dispatch(setCaseHasData(hasData))
          
          // АВТОМАТИЧЕСКИ ВЫБИРАЕМ РЕЖИМ В ЗАВИСИМОСТИ ОТ НАЛИЧИЯ ДАННЫХ
          if (hasData) {
            dispatch(setOperationMode('playback')) // Есть данные - только просмотр
          } else {
            dispatch(setOperationMode('simulation')) // Нет данных - только запись
          }
        } catch (error) {
          console.error('Ошибка проверки данных кейса:', error)
        }
      }
    }

    checkData()
  }, [currentCase])

  // Загрузка данных при смене режима или кейса
  useEffect(() => {
    const loadData = async () => {
      if (!currentCase) return;
      
      if (operationMode === 'playback') {
        try {
          const historicalData = await dispatch(loadHistoricalData(currentCase.id)).unwrap()
          dispatch(setHistoricalData(historicalData))
          
          const points = historicalData.map(item => ({
            t: parseTs(item.timestamp),
            bpm: item.bpm,
            uc: item.uc,
            risk: item.risk
          }))
          console.log(points)


          setRawPoints(points)
          setInterpolatedPoints(points)
          
          if (points.length > 0) {
            const minTime = points[0].t
            const maxTime = points[points.length - 1].t
            setCurrentTimeWindow([minTime, maxTime])
          }
        } catch (error) {
          console.error('Ошибка загрузки исторических данных:', error)
        }
      } else if (operationMode === 'simulation') {
        clearChartData()
      }
    }

    loadData()
  }, [operationMode, currentCase])

  // Управление симуляцией на бэкенде
  useEffect(() => {
    const handleSimulation = async () => {
      if (operationMode === 'simulation' && recordingMode === 'recording' && currentCase && !isSimulating) {
        try {
          await dispatch(startSimulation({ caseId: currentCase.id, hz: 1 })).unwrap()
          dispatch(setSimulationStatus(true))
          console.log('Симуляция запущена на бэкенде')
        } catch (error) {
          console.error('Ошибка запуска симуляции:', error)
        }
      } else if (isSimulating && (operationMode !== 'simulation' || recordingMode !== 'recording')) {
        try {
          if (currentCase) {
            await dispatch(stopSimulation(currentCase.id)).unwrap()
          }
          dispatch(setSimulationStatus(false))
          console.log('Симуляция остановлена на бэкенде')
        } catch (error) {
          console.error('Ошибка остановки симуляции:', error)
        }
      }
    }

    handleSimulation()
  }, [operationMode, recordingMode, currentCase, isSimulating])

  // Получение данных в режиме симуляции
  useEffect(() => {
    const fetchData = async () => {
      if (operationMode === 'simulation' && recordingMode === 'recording' && currentCase && isSimulating) {
        try {
          const [latestPoint, prediction] = await Promise.all([
            dispatch(fetchLatestDataPoint(currentCase.id)).unwrap(),
            dispatch(fetchPredictions(currentCase.id)).unwrap()
          ])
          
          if (latestPoint) {
            const point = {
              t: parseTs(latestPoint.timestamp),
              bpm: latestPoint.bpm,
              uc: latestPoint.uc,
              risk: prediction ? prediction.probability : 0
            }
            pushPoint(point)
          }
        } catch (error) {
          console.error('Ошибка получения данных:', error)
        }
      }
    }

    if (operationMode === 'simulation' && recordingMode === 'recording' && currentCase && isSimulating) {
      if (!timerRef.current) {
        timerRef.current = setInterval(fetchData, 1000)
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [operationMode, recordingMode, currentCase, isSimulating])

  useEffect(() => {
    // Если мы были в режиме записи и она остановилась, но данные не сохранены
    if (operationMode === 'simulation' && recordingMode === 'idle' && hasUnsavedChanges) {
      // Предлагаем сохранить или автоматически переключаем?
      // Пока оставим как есть - пользователь сам решит сохранять или нет
    }
    
    // Если запись завершена и данные сохранены, автоматически переключаемся
    if (operationMode === 'simulation' && recordingMode === 'idle' && !hasUnsavedChanges && dataPoints.length > 0) {
      // Данные сохранены - переключаем в режим просмотра
      dispatch(completeRecording())
      console.log('Автоматическое переключение в режим просмотра после сохранения')
    }
  }, [operationMode, recordingMode, hasUnsavedChanges, dataPoints.length])

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
      if (currentCase && isSimulating) {
        dispatch(stopSimulation(currentCase.id))
      }
    }
  }, [currentCase, isSimulating])

  // Фильтруем данные для отображения
  const displayData = interpolatedPoints.filter(point =>
    point.t >= currentTimeWindow[0] && point.t <= currentTimeWindow[1]
  )

  // ОПРЕДЕЛЯЕМ ДОСТУПНЫЕ РЕЖИМЫ В ЗАВИСИМОСТИ ОТ НАЛИЧИЯ ДАННЫХ
  const getAvailableModes = () => {
    if (!currentCase) return []
    
    if (caseHasData) {
      return ['playback'] // Только просмотр если есть данные
    } else {
      return ['simulation'] // Запись если пусто
    }
  }

  const getDisplayModeDescription = () => {
    if (!currentPatient) return "Выберите пациента для начала работы"
    if (!currentCase) return "Выберите или создайте исследование"
    
    if (operationMode === 'simulation') {
      if (recordingMode === 'recording') {
        return `🔴 Запись симуляции: ${currentCase.description || `Исследование #${currentCase.id}`}`
      } else {
        return `⏸️ Готов к записи: ${currentCase.description || `Исследование #${currentCase.id}`}`
      }
    } else if (operationMode === 'playback') {
      return `📊 Просмотр данных: ${currentCase.description || `Исследование #${currentCase.id}`}`
    }
    
    return "Готов к работе"
}

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Доступ запрещен</h2>
          <p className="text-slate-400">Для доступа к системе необходимо авторизоваться</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Кардиотокография</h1>
          <div className="text-sm text-slate-400">
            {user.name} • {new Date().toLocaleDateString('ru-RU')}
          </div>
        </header>

        <CaseSelector />

        {/* ПЕРЕДАЕМ ДОСТУПНЫЕ РЕЖИМЫ В ModeSelector */}
        <ModeSelector 
          currentMode={operationMode}
          onModeChange={(mode) => dispatch(setOperationMode(mode))}
          disabled={!currentCase}
          availableModes={getAvailableModes()} // ДОБАВЛЕНО
          caseHasData={caseHasData} // ДОБАВЛЕНО
        />

        <RecordingControls />

        {/* Остальной код без изменений */}
        {currentCase && (
          <>
            <section className="bg-slate-800 rounded-2xl p-4 shadow">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg">ЧСС (уд/мин)</h2>
                <span style={{ color: '#60A5FA' }} className="font-semibold text-lg">
                  {(rawPoints.at(-1)?.bpm ?? 0).toFixed(1)} bpm
                </span>
              </div>
              <RealtimeLineChart
                data={displayData}
                timeWindow={currentTimeWindow}
                series={[{ dataKey: "bpm", name: "ЧСС", type: "monotone", stroke: "#60A5FA" }]}
                yDomain={[50, 210]}
                yLabel="bpm"
                height={200}
                isStatic={operationMode === 'playback'}
              />
            </section>

            <section className="bg-slate-800 rounded-2xl p-4 shadow">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg">Маточная активность</h2>
                <span style={{ color: '#34D399' }} className="font-semibold text-lg">
                  {(rawPoints.at(-1)?.uc ?? 0).toFixed(1)}
                </span>
              </div>
              <RealtimeLineChart
                data={displayData}
                timeWindow={currentTimeWindow}
                series={[{ dataKey: "uc", name: "UC", type: "monotone", stroke: "#34D399" }]}
                yDomain={[0, 50]}
                yLabel="UC"
                height={200}
                isStatic={operationMode === 'playback'}
              />
            </section>

            <section className="bg-slate-800 rounded-2xl p-4 shadow">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg">Вероятность развития осложнений</h2>
                <span style={{ color: '#F87171' }} className="font-semibold text-lg">
                  {(rawPoints.at(-1)?.risk ?? 0).toFixed(2)}
                </span>
              </div>
              <RealtimeLineChart
                data={displayData}
                timeWindow={currentTimeWindow}
                series={[{ dataKey: "risk", name: "Риск", type: "monotone", stroke: "#F87171" }]}
                yDomain={[0, 1]}
                yLabel="prob"
                referenceLines={[{ y: 0.7, stroke: "#FCA5A5" }]}
                height={200}
                isStatic={operationMode === 'playback'}
              />
            </section>
          </>
        )}

        {!currentCase && (
          <div className="bg-slate-800 rounded-2xl p-8 text-center">
            <div className="text-slate-400 text-lg">
              Выберите пациента и исследование для начала работы
            </div>
            <div className="text-slate-500 text-sm mt-2">
              Создайте новое исследование для записи данных или выберите существующее для просмотра
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard