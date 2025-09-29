// pages/Dashboard.jsx
import React, { useEffect, useRef, useState, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigationGuard } from "../hooks/useNavigationGuard"
import CaseSelector from "../components/CaseSelector"
import ModeSelector from "../components/ModeSelector"
import RecordingControls from "../components/RecordingControls"
import RealtimeLineChart from "../components/RealtimeLineChart"

import {
  startSimulation,        // backend: старт «симуляции» = начало записи
  stopSimulation,         // backend: стоп «симуляции» = конец записи
  loadHistoricalData,
  fetchLatestDataPoint,
  fetchPredictions,
  checkCaseHasData,
} from "../asyncActions/stream"

import {
  addDataPoint,
  setHistoricalData,
  clearData,
  setOperationMode,
  setCaseHasData,
} from "../store/streamSlice"

import Controls from "../components/Controls";

// === Константы ===
const WINDOW_SECONDS = 60 * 5
const POLL_MS = 1000
const RISK_THR = 0.7 // локальный порог подсветки, если бэк не вернул alert

export default function Dashboard() {
  const dispatch = useDispatch()
  const [dataMode, setDataMode] = useState("demo");         // "demo" | "ws" | "sse"
  const [dataConnected, setDataConnected] = useState(false); // индикатор контролов
  const {
    currentCase,
    currentPatient,
    operationMode,     // 'playback' | 'record'
    recordingMode,     // 'idle' | 'recording' | 'reviewing'
    hasUnsavedChanges,
    dataPoints,
    historicalData,
    caseHasData,
  } = useSelector((s) => s.stream)

  const { user } = useSelector((s) => s.app)

  // Локальное состояние для графиков (не мешаем стору считать несохранённое)
  const [rawPoints, setRawPoints] = useState([])
  const [timeWindow, setTimeWindow] = useState([0, WINDOW_SECONDS])

  const pollRef = useRef(null)

  useNavigationGuard(hasUnsavedChanges)

  const parseTs = (t) => (typeof t === "string" ? new Date(t).getTime() / 1000 : t)

  // === Хелпер: сброс локальных данных графика ===
  const resetCharts = () => {
    setRawPoints([])
    setTimeWindow([0, WINDOW_SECONDS])
  }

  // === Подсветка тревоги (alert) ===
  const withAlert = (point, prediction) => {
    // если бэк вернул alert — используем его, иначе локальный порог
    const prob = prediction?.probability ?? point?.risk ?? 0
    const alert = typeof prediction?.alert !== "undefined"
      ? Number(Boolean(prediction.alert))
      : Number(prob >= RISK_THR)
    return { ...point, risk: prob, alert }
  }

  // === Следим за выбором кейса: узнаём, есть ли данные, и ставим режим ===
  useEffect(() => {
    const run = async () => {
      if (!currentCase) return
      try {
        const has = await dispatch(checkCaseHasData(currentCase.id)).unwrap()
        dispatch(setCaseHasData(has))
        dispatch(setOperationMode(has ? "playback" : "record"))
      } catch (e) {
        console.error("Ошибка проверки данных кейса:", e)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCase?.id])

  // === Загрузка/очистка точек в зависимости от режима ===
  useEffect(() => {
    const load = async () => {
      if (!currentCase) return
      if (operationMode === "playback") {
        try {
          const hist = await dispatch(loadHistoricalData(currentCase.id)).unwrap()
          dispatch(setHistoricalData(hist))
          const points = (hist || []).map((it) => ({
            t: parseTs(it.timestamp),
            bpm: it.bpm,
            uc: it.uc,
            risk: it.risk ?? 0,
            alert: Number(Boolean(it.alert)),
          }))
          setRawPoints(points)
          if (points.length) {
            setTimeWindow([points[0].t, points.at(-1).t])
          } else {
            setTimeWindow([0, WINDOW_SECONDS])
          }
        } catch (e) {
          console.error("Ошибка загрузки исторических данных:", e)
          setRawPoints([])
          setTimeWindow([0, WINDOW_SECONDS])
        }
      } else if (operationMode === "record") {
        // переходим в запись — чистим графики
        resetCharts()
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationMode, currentCase?.id])

  // === Старт/стоп симуляции на бэке при смене recordingMode ===
  useEffect(() => {
    const apply = async () => {
      if (!currentCase) return

      // Начали запись
      if (operationMode === "record" && recordingMode === "recording" && !pollRef.current) {
        try {
          await dispatch(startSimulation({ caseId: currentCase.id, hz: 1 })).unwrap()
          // Запускаем опрос последней точки + предсказания
          const tick = async () => {
            try {
              const [latest, pred] = await Promise.all([
                dispatch(fetchLatestDataPoint(currentCase.id)).unwrap(),
                dispatch(fetchPredictions(currentCase.id)).unwrap(),
              ])
              if (latest) {
                const point = {
                  t: parseTs(latest.timestamp),
                  bpm: latest.bpm,
                  uc: latest.uc,
                }
                const enriched = withAlert(point, pred)
                // в стор — чтобы помечать «несохранённые»
                dispatch(addDataPoint(enriched))
                // локально — для графика
                setRawPoints((prev) => {
                  const next = [...prev, enriched]
                  // обновляем окно на последние 5 минут
                  const tNow = enriched.t
                  const tStart = Math.max(0, tNow - WINDOW_SECONDS)
                  setTimeWindow([tStart, tNow])
                  // можно ограничить длину массива, чтобы не пух
                  const cutIdx = next.findIndex((p) => p.t >= tStart)
                  return cutIdx <= 0 ? next : next.slice(cutIdx)
                })
              }
            } catch (e) {
              console.error("Ошибка получения данных записи:", e)
            }
          }
          // первый тик сразу, далее интервал
          await tick()
          pollRef.current = setInterval(tick, POLL_MS)
        } catch (e) {
          console.error("Ошибка запуска записи (симуляции):", e)
        }
      }

      // Остановили запись или вышли из режима
      if (!(operationMode === "record" && recordingMode === "recording") && pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
        try {
          await dispatch(stopSimulation(currentCase.id)).unwrap()
        } catch (e) {
          // если не было активной сессии — просто молчим в лог
          console.warn("Стоп записи (симуляции) завершился с предупреждением:", e)
        }
      }
    }
    apply()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationMode, recordingMode, currentCase?.id])

  // === При размонтировании — подчистим интервал и остановим запись на бэке ===
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      if (currentCase) {
        // best-effort
        dispatch(stopSimulation(currentCase.id))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // === Видимые данные под текущее окно ===
  const displayData = useMemo(() => {
    const [t0, t1] = timeWindow
    return rawPoints.filter((p) => p.t >= t0 && p.t <= t1)
  }, [rawPoints, timeWindow])

  // === Доступные режимы для переключателя ===
  const availableModes = useMemo(() => {
    if (!currentCase) return []
    return caseHasData ? ["playback"] : ["record"]
  }, [currentCase, caseHasData])

  const modeCaption = useMemo(() => {
    if (!currentPatient) return "Выберите пациента для начала работы"
    if (!currentCase) return "Выберите или создайте исследование"
    if (operationMode === "record") {
      return recordingMode === "recording"
        ? `🔴 Запись данных: ${currentCase.description || `Исследование #${currentCase.id}`}`
        : `⏸️ Готов к записи: ${currentCase.description || `Исследование #${currentCase.id}`}`
    }
    return `📊 Просмотр данных: ${currentCase.description || `Исследование #${currentCase.id}`}`
  }, [currentPatient, currentCase, operationMode, recordingMode])

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Доступ запрещен</h2>
          <p className="text-gray-600">Для доступа к системе необходимо авторизоваться</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Кардиотокография</h1>
        </header>

        {/* Источник данных: сейчас доступен только Демо */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <Controls
            connected={dataConnected}
            mode={dataMode}
            setMode={setDataMode}
            availableModes={["demo"]}
            onConnect={() => setDataConnected(true)}
            onDisconnect={() => setDataConnected(false)}
          />
        </div>

        <CaseSelector />

        <ModeSelector
          currentMode={operationMode}
          onModeChange={(mode) => dispatch(setOperationMode(mode))}
          disabled={!currentCase}
          availableModes={availableModes}
          caseHasData={caseHasData}
        />

        <RecordingControls />

        {currentCase ? (
          <>
          {/* ЧСС */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-medium text-gray-900">ЧСС (уд/мин)</h2>
            <span className="font-semibold text-lg text-blue-600">
              {(rawPoints.at(-1)?.bpm ?? 0).toFixed(1)} bpm
            </span>
          </div>
          <div className="bg-slate-900 rounded-lg p-2 mt-2">
            <RealtimeLineChart
              data={displayData}
              timeWindow={timeWindow}
              series={[{ dataKey: "bpm", name: "ЧСС", type: "monotone", stroke: "#60A5FA" }]}
              yDynamic
              yClamp={[50, 210]}
              yLabel="bpm"
              height={200}
              isStatic={operationMode === "playback"}
              alertKey="alert"
            />
          </div>
        </section>

        {/* Маточная активность */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-medium text-gray-900">Маточная активность</h2>
            <span className="font-semibold text-lg text-green-600">
              {(rawPoints.at(-1)?.uc ?? 0).toFixed(1)}
            </span>
          </div>
          <div className="bg-slate-900 rounded-lg p-2 mt-2">
            <RealtimeLineChart
              data={displayData}
              timeWindow={timeWindow}
              series={[{ dataKey: "uc", name: "UC", type: "monotone", stroke: "#34D399" }]}
              yDynamic
              yClamp={[0, 50]}
              yLabel="UC"
              height={200}
              isStatic={operationMode === "playback"}
              alertKey="alert"
            />
          </div>
        </section>

        {/* Вероятность осложнений */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-medium text-gray-900">Вероятность осложнений</h2>
            <span className="font-semibold text-lg text-red-600">
              {(rawPoints.at(-1)?.risk ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-900 rounded-lg p-2 mt-2">
            <RealtimeLineChart
              data={displayData}
              timeWindow={timeWindow}
              series={[{ dataKey: "risk", name: "Риск", type: "monotone", stroke: "#F87171" }]}
              yDynamic
              yClamp={[0, 1]}
              yLabel="prob"
              referenceLines={[{ y: RISK_THR, stroke: "#FCA5A5" }]}
              height={200}
              isStatic={operationMode === "playback"}
              alertKey="alert"
            />
          </div>
        </section>
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="text-gray-600 text-lg">
              Выберите пациента и исследование для начала работы
            </div>
            <div className="text-gray-500 text-sm mt-2">
              Создайте новое исследование для записи данных или выберите существующее для просмотра
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
