/**
 * @component Dashboard
 * @description Главная страница системы мониторинга. Отображает графики ЧСС, маточной активности и рисков в реальном времени, управляет режимами записи и просмотра данных.
 */
// pages/Dashboard.jsx
import React, { useEffect, useRef, useState, useMemo } from "react"
import { useNavigate } from 'react-router-dom'
import { HelpCircle, ChevronDown, ChevronUp, Copy, Check, Download } from 'lucide-react'
import { useSelector, useDispatch } from "react-redux"
import { useNavigationGuard } from "../hooks/useNavigationGuard"
import CaseSelector from "../components/CaseSelector"
import ModeSelector from "../components/ModeSelector"
import RecordingControls from "../components/RecordingControls"
import RealtimeLineChart from "../components/RealtimeLineChart"
import PlotlyHistoryChart from "../components/PlotlyHistoryChart"
import { createWsToken, checkWsTokenExists } from "../asyncActions/wsToken"
import { loadStoredWsToken, storeWsToken } from "../store/wsTokenStorage"
import { provisionBridgeWs } from "../asyncActions/bridgeActions"
import { exportPlotlyToHtml, collectChartsData } from "../utils/plotlyExport"
import RiskAlertModal from "../components/RiskAlertModal"

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
  setOperationMode,
  setCaseHasData,
  startRecording,
  stopRecording,
  setCurrentPatient
} from "../store/streamSlice"

import { FRONTEND_PAGES } from "../imports/ENDPOINTS"

import Controls from "../components/Controls"

// === Константы ===
const WINDOW_SECONDS = 60 * 5
// Горизонт прогноза для симуляции (мин)
const H_OPTIONS = [5, 10, 15]
const STRIDE_OPTIONS = [1, 5, 15, 30]
const POLL_MS = 1000
const RISK_THR = 0.7 // локальный порог подсветки, если бэк не вернул alert
// WS endpoint: VITE_WS_URL имеет приоритет. Фолбэк — текущий хост.
const WS_BASE = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`

function WsSensorUrl({ WS_BASE, caseId, horizonMin, strideSec }) {
  const dispatch = useDispatch()

  const [url, setUrl] = useState(null)
  const [status, setStatus] = useState("idle") // idle | creating | ready | need_manual
  const runKeyRef = useRef("")
  const userRaw = localStorage.getItem("user") || sessionStorage.getItem("user")
  let userObj = null; try { userObj = userRaw ? JSON.parse(userRaw) : null } catch {}
  const userId = userObj?.id

  const makeUrl = (token) =>
    `${WS_BASE.replace(/\/$/,"")}/case/${caseId}?token=${encodeURIComponent(token)}&H=${horizonMin}&stride=${strideSec}`

  useEffect(() => {
    if (!userId || !caseId) return

    // если URL уже есть — просто пересобери его при смене параметров и выйди
    const storedForRefresh = loadStoredWsToken(userId, caseId)
    if (url && status === "ready") {
      if (storedForRefresh) setUrl(makeUrl(storedForRefresh))
      return
    }

    // ключ только по паре userId:caseId, без H/stride/WS_BASE
    const key = `${userId}:${caseId}`
    runKeyRef.current = key

    if (status === "idle") setStatus("creating")

    // 1) из хранилища
    const stored = storedForRefresh
    if (stored) {
      if (runKeyRef.current === key) {
        const u = makeUrl(stored)
        setUrl(u)
        setStatus("ready")
      }
      return
    }

    // 2) создать
    dispatch(createWsToken({ userId, caseId }))
      .unwrap()
      .then((res) => {
        if (runKeyRef.current !== key) return
        if (res.status === "created" && res.token) {
          storeWsToken(userId, caseId, res.token, "session")
          const u = makeUrl(res.token)
          setUrl(u)
          setStatus("ready")
          return
        }
        // 3) уже есть на бэке, секрета нет
        dispatch(checkWsTokenExists({ userId, caseId }))
          .unwrap()
          .then((r) => {
            if (runKeyRef.current !== key) return
            // перед тем как ставить need_manual — ещё раз проверим хранилище
            const nowStored = loadStoredWsToken(userId, caseId)
            if (nowStored) {
              const u2 = makeUrl(nowStored)
              setUrl(u2)
              setStatus("ready")
              return
            }
            setStatus(r.exists ? "need_manual" : "creating")
            if (!r.exists) {
              // повторная попытка создать
              dispatch(createWsToken({ userId, caseId }))
                .unwrap()
                .then((r2) => {
                  if (runKeyRef.current !== key) return
                  if (r2.status === "created" && r2.token) {
                    storeWsToken(userId, caseId, r2.token, "session")
                    const u3 = makeUrl(r2.token)
                    setUrl(u3)
                    setStatus("ready")
                  } else {
                    setStatus("need_manual")
                  }
                })
                .catch(() => { if (runKeyRef.current === key) setStatus("need_manual") })
            }
          })
          .catch(() => { if (runKeyRef.current === key) setStatus("need_manual") })
      })
      .catch(() => { if (runKeyRef.current === key) setStatus("need_manual") })

    return () => { runKeyRef.current = "" }
  }, [userId, caseId, horizonMin, strideSec, WS_BASE, dispatch, url, status])

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  if (status === "ready" && url) {
    return (
      <div className="mt-4 p-4 bg-white border border-gray-300 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-700 mb-1">Подключите датчик к URL:</p>
            <code className="text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-300 break-all font-mono">
              {url}
            </code>
          </div>
          <button
            onClick={handleCopy}
            className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shrink-0"
          >
            {copied ? (
              <>
                <Check size={16} />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Копировать</span>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  if (status === "creating") {
    return (
       <div className="mt-4 p-4 bg-white border border-gray-300 rounded-2xl shadow-sm">
         <div className="flex items-center space-x-3">
           <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
           <span className="text-sm text-slate-700">Генерируем ключ подключения…</span>
         </div>
       </div>
     )
  }

  return (
    <div className="mt-4 p-4 bg-white border border-gray-300 rounded-2xl shadow-sm">
       <div className="text-sm text-slate-700">
         Токен для этого кейса уже существует, но на этом клиенте он отсутствует.
       </div>
     </div>
  )
}

export default function Dashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const bpmChartRef = useRef(null)
  const ucChartRef = useRef(null)
  const riskChartRef = useRef(null)

  const [figo, setFigo] = useState(null)
  const [showAdvancedFigo, setShowAdvancedFigo] = useState(false)
  const [dataMode, setDataMode] = useState("demo")         // "demo" | "ws" | "usb"
  const [dataConnected, setDataConnected] = useState(false) // индикатор контролов
  const {
    currentCase,
    currentPatient,
    operationMode,     // 'playback' | 'record'
    recordingMode,     // 'idle' | 'recording' | 'reviewing'
    hasUnsavedChanges,
    caseHasData
  } = useSelector((s) => s.stream)
  const { patient_array } = useSelector(s => s.patient)
  const [horizonMin, setHorizonMin] = useState(5)
  const [strideSec, setStrideSec] = useState(1)


  const { user } = useSelector((s) => s.app)
  const connectLocked = !!caseHasData

  // Локальное состояние для графиков (не мешаем стору считать несохранённое)
  const [rawPoints, setRawPoints] = useState([])
  const [timeWindow, setTimeWindow] = useState([0, WINDOW_SECONDS])

  const pollRef = useRef(null)
  const pollWsRef = useRef(null)            // <== новый пуллер для режима WS
  // небольшая плашка-уведомление для USB-моста
  const [bridgeNotice, setBridgeNotice] = useState(null)

  useNavigationGuard(hasUnsavedChanges)
    // ==== Risk alert modal (только по сигналу модели) ====
  const [showRiskAlert, setShowRiskAlert] = useState(false)
  const [alertRiskLevel, setAlertRiskLevel] = useState(0)
  const [alertAt, setAlertAt] = useState(null)    
  const prevAlertRef = useRef(0) 
  useEffect(() => {
    const last = rawPoints.at(-1)
    if (operationMode !== "playback" && last?.alert === 1) {
      setAlertRiskLevel(typeof last.risk === "number" ? last.risk : 0)
      if (prevAlertRef.current !== 1) {
        const tsMs = last?.t ? last.t * 1000 : Date.now()
        setAlertAt(tsMs)
      }
      setShowRiskAlert(true)
      prevAlertRef.current = 1
    } else {
      setShowRiskAlert(false)
      prevAlertRef.current = 0
    }
  }, [rawPoints.length, operationMode])

  // Основной cleanup при размонтировании
  useEffect(() => {
    return () => {
      if (currentCase?.id && recordingMode === 'recording') {
        console.log('Dashboard unmounting - stopping simulation')
        dispatch(stopSimulation(currentCase.id)).catch(error => {
          console.warn('Stop simulation error:', error)
        })
      }
    }
  }, [dispatch, currentCase?.id, recordingMode])

  // Защита при закрытии страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentCase?.id && recordingMode === 'recording') {
        // Для beforeunload используем синхронную отправку
        dispatch(stopSimulation(currentCase.id))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dispatch, currentCase?.id, recordingMode])

  const parseTs = (t) => (typeof t === "string" ? new Date(t).getTime() / 1000 : t)

  // === Хелпер: сброс локальных данных графика ===
  const resetCharts = () => {
    console.log('Вызов reset')
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

  const handleExportCharts = () => {
    if (!currentCase || rawPoints.length === 0) {
      console.warn('No data available for export')
      return
    }
    
    console.log('Exporting charts with points:', rawPoints.length)

    const currentPatientData = patient_array.find((p) => p.id === currentPatient)
    
    const chartsData = collectChartsData(
      null, // plotlyComponents не используется в новой версии
      rawPoints, 
      currentCase,
      currentPatientData, 
      operationMode,
      figo,
      { horizonMin, strideSec }
    )
    
    if (chartsData && chartsData.charts && chartsData.charts.length > 0) {
      console.log('Charts data collected successfully:', chartsData.charts.length, 'charts');
      exportPlotlyToHtml(chartsData, chartsData.metadata.filename)
    } else {
      console.error('Failed to collect charts data')
    }
  }

  // FIGO: извлечь ключевые показатели из features
   const extractFigo = (pred) => { 
     const f = pred?.features || {}
     // ОСНОВНЫЕ
     const baseline = Number(f.baseline ?? NaN)
     const bpm_sd = Number(f.bpm_sd ?? NaN)
     const stv = Number(f.stv ?? NaN)
     const evtAccelTotal = Number(f.evt_accel_total ?? 0)
     const evtDecelTotal = Number(f.evt_decel_total ?? 0)
     const evtDecelEarly = Number(f.evt_decel_early ?? 0)
     const evtDecelLate = Number(f.evt_decel_late ?? 0)
     const evtDecelVariable = Number(f.evt_decel_variable ?? 0)
     const evtDecelProlonged = Number(f.evt_decel_prolonged ?? 0)
     const evtTachyRatio = Number(f.evt_tachy_ratio ?? 0) > 0
     const evtBradyRatio = Number(f.evt_brady_ratio ?? 0) > 0
     const evtContractions = Number(f.evt_contractions ?? 0)

     // ДОПОЛНИТЕЛЬНЫЕ
     const bpmIQR = Number(f.bpm_iqr ?? NaN)
     const evtLowVarRatio = Number(f.evt_low_var_ratio ?? 0) > 0
     const evtLowVarMean = Number(f.evt_low_var_mean ?? NaN)
     const evtSdOverall = Number(f.evt_sd_overall ?? NaN)
     const extraRMSSD = Number(f.extra_rmssd ?? NaN)
     const extraPoincareSD1 = Number(f.extra_poincare_sd1 ?? NaN)
     const extraPoincareSD2 = Number(f.extra_poincare_sd2 ?? NaN)
     const extraSD1SD2Ratio = Number(f.extra_sd1_sd2_ratio ?? NaN)
     const extraAcPeakLag = Number(f.extra_ac_peak_lag ?? NaN)
     const extraAcDecayTime = Number(f.extra_ac_decay_time ?? NaN)

     const baselineClass =
       isFinite(baseline)
         ? (baseline < 110 ? "брадикардия" : baseline > 160 ? "тахикардия" : "норма")
         : "—"

     const varClass =
       isFinite(bpm_sd)
         ? (bpm_sd < 5 ? "низкая" : bpm_sd > 25 ? "повышенная" : "норма")
         : (isFinite(stv) ? (stv < 3 ? "низкая" : stv > 15 ? "повышенная" : "норма") : "—")

     const decelClass =
       evtDecelTotal > 0
         ? `есть (${[
             evtDecelEarly ? "ранние" : null,
             evtDecelLate ? "поздние" : null,
             evtDecelVariable ? "вариаб." : null,
             evtDecelProlonged ? "продол." : null,
           ].filter(Boolean).join(", ") || "без типа"})`
         : "нет"

     const accelClass = evtAccelTotal > 0 ? "есть" : "нет"
 
     return {
      baseline: isFinite(baseline) ? Math.round(baseline) : null,
      baselineClass: baselineClass,
      bpm_sd: isFinite(bpm_sd) ? bpm_sd.toFixed(1) : (isFinite(stv) ? stv.toFixed(2) : null),
      varClass: varClass,
      stv: stv,
      evtAccelTotal: evtAccelTotal,
      accelClass: accelClass,
      evtDecelTotal: evtDecelTotal,
      decelerationsClass: decelClass,
      evtDecelEarly: evtDecelEarly,
      evtDecelLate: evtDecelLate,
      evtDecelVariable: evtDecelVariable,
      evtDecelProlonged: evtDecelProlonged,
      evtTachyRatio: evtTachyRatio,
      evtBradyRatio: evtBradyRatio,
      evtContractions: evtContractions,

      // Новые расширенные параметры
      bpmIQR: bpmIQR.toFixed(2),
      evtLowVarRatio: evtLowVarRatio,
      evtLowVarMean: evtLowVarMean.toFixed(2),
      evtSdOverall: evtSdOverall.toFixed(2),
      extraRMSSD: extraRMSSD.toFixed(2),
      extraPoincareSD1: extraPoincareSD1.toFixed(2),
      extraPoincareSD2: extraPoincareSD2.toFixed(2),
      extraSD1SD2Ratio: extraSD1SD2Ratio.toFixed(2),
      extraAcPeakLag: extraAcPeakLag,
      extraAcDecayTime: extraAcDecayTime,
      
    }
  }

  // Если кейс сохранён — рвём любое подключение (demo/ws) и чистим пуллинг
  useEffect(() => {
    if (!connectLocked) return
    console.log('Зашел куда-то')
    if (!(operationMode === 'playback')) {
      if (dataConnected) setDataConnected(false)
      if (pollWsRef.current) { clearInterval(pollWsRef.current); pollWsRef.current = null }
      if (pollRef.current)   { clearInterval(pollRef.current);   pollRef.current = null }

      if (currentCase?.id) { dispatch(stopSimulation(currentCase.id)).catch(()=>{}) }
    }
    setDataMode("demo")
    // resetCharts()
  }, [connectLocked])  // намеренно без dataMode/dataConnected

  // === Следим за выбором кейса: узнаём, есть ли данные, и ставим режим ===
  // === А также загружаем/удаляем точки в зависимости от содержимого кейса
  useEffect(() => {
    const run = async () => {
      if (!currentCase) return
      try {
        const has = await dispatch(checkCaseHasData(currentCase.id)).unwrap()
        dispatch(setCaseHasData(has))
        dispatch(setOperationMode(has ? "playback" : "record"))

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
            // получить последнее предсказание для FIGO
            try {
              const lastPred = await dispatch(fetchPredictions(currentCase.id)).unwrap()
              if (lastPred) setFigo(extractFigo(lastPred))
            } catch (e) {
              console.warn("FIGO unavailable:", e)
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
      } catch (e) {
        console.error("Ошибка проверки данных кейса:", e)
      }
    }

    run()
  }, [currentCase?.id])

  // === Старт/стоп симуляции на бэке при смене recordingMode (НЕ для ws режима) ===
  useEffect(() => {
    const apply = async () => {
      if (!currentCase) return
      if (dataMode === "ws") return

      // Начали запись
      if (operationMode === "record" && recordingMode === "recording" && !pollRef.current) {
        try {
          await dispatch(startSimulation({ caseId: currentCase.id, hz: 1, H: horizonMin, stride_s: strideSec })).unwrap()
          // Запускаем опрос последней точки   предсказания
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
                if (pred) setFigo(extractFigo(pred))
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
  }, [operationMode, recordingMode, currentCase?.id, dataMode, horizonMin])

  // === Теневой пуллинг при активном WS: как в симуляции, без лишней логики ===
  useEffect(() => {
    const apply = async () => {
      if (!currentCase) return

      // Запускаем пуллинг только когда активен потоковый источник (WS/USB)
      const liveActive = (dataMode === "ws" || dataMode === "usb") && dataConnected
      if (liveActive && !pollWsRef.current) {
        const tick = async () => {
          try {
            const [latest, pred] = await Promise.all([
              dispatch(fetchLatestDataPoint(currentCase.id)).unwrap(),
              dispatch(fetchPredictions(currentCase.id)).unwrap(),
            ])

            if (!latest) return

            const point = {
              t: parseTs(latest.timestamp),
              bpm: latest.bpm,
              uc: latest.uc,
            }
            const enriched = withAlert(point, pred)

            // стор
            dispatch(addDataPoint(enriched))

            // локально для графика
            if (pred) setFigo(extractFigo(pred))
            setRawPoints((prev) => {
              const next = [...prev, enriched]
              const tNow = enriched.t
              const tStart = Math.max(0, tNow - WINDOW_SECONDS)
              setTimeWindow([tStart, tNow])
              const cutIdx = next.findIndex((p) => p.t >= tStart)
              return cutIdx <= 0 ? next : next.slice(cutIdx)
            })
          } catch (e) {
            console.error("WS polling error:", e)
          }
        }

        await tick()
        pollWsRef.current = setInterval(tick, POLL_MS)
      }

      // Остановили пуллинг при выходе из live-состояния
      if (!((dataMode === "ws" || dataMode === "usb") && dataConnected) && pollWsRef.current) {
        clearInterval(pollWsRef.current)
        pollWsRef.current = null
      }
    }

    apply()
    return () => {
      if (pollWsRef.current) {
        clearInterval(pollWsRef.current)
        pollWsRef.current = null
      }
    }
  }, [dataMode, dataConnected, currentCase?.id, dispatch])

  // === WS-подключение: только управление состояниями, без данных ===
 
  // === Очистка при размонтировании ===
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      if (pollWsRef.current) {
        clearInterval(pollWsRef.current)
        pollWsRef.current = null
      }
      if (
        currentCase?.id &&
        dataMode !== "ws" &&
        operationMode === "record" &&
        recordingMode === "recording"
      ) {
        dispatch(stopSimulation(currentCase.id))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Простой сброс FIGO: новый кейс в онлайне
  useEffect(() => {
    if (!currentCase) return
    if (operationMode !== "playback") {
      setFigo(null)
    }
  }, [currentCase?.id, operationMode])
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

        <CaseSelector />

        <div className="flex items-center justify-between bg-white border border-gray-300 rounded-2xl p-4 shadow-sm">
           <Controls
              connected={dataConnected}
              mode={dataMode}
              setMode={setDataMode}
              availableModes={["demo","ws","usb"]}                      // выбирать можно
              canConnect={Boolean(currentCase?.id) && !connectLocked}   // подключаться нельзя
              connectLocked={connectLocked}
              onConnect={() => {
                if (!currentCase?.id) return

                if (dataMode === "ws") {
                  // включаем WS-режим: фронт НЕ открывает сокет, просто начинает пуллинг
                  setDataConnected(true)
                  if (operationMode !== "record") dispatch(setOperationMode("record"))
                  dispatch(startRecording()) // блок «Начать запись»
                 } else if (dataMode === "usb") {
                   // USB-мост: 1) убедиться, что WS-токен существует (молча)
                   //           2) запросить на бэке создание drop-файла для моста
                   const run = async () => {
                     try {
                       // попытка создать токен (если уже есть — backend вернёт exists, это нормально)
                       await dispatch(createWsToken({ userId: user?.id, caseId: currentCase.id })).unwrap().catch(() => {})
                       // подстраховка — проверить наличие
                       await dispatch(checkWsTokenExists({ userId: user?.id, caseId: currentCase.id })).unwrap()
                       // создать drop-файл
                       const res = await dispatch(
                         provisionBridgeWs({
                           userId: user?.id,
                           caseId: currentCase.id,
                           H: horizonMin,
                           stride: strideSec
                         })
                       ).unwrap()
                       setBridgeNotice(`USB-мост подготовлен: ${res.filename}`)
                       // включаем "живой" режим так же, как для WS
                       setDataConnected(true)
                       if (operationMode !== "record") dispatch(setOperationMode("record"))
                       dispatch(startRecording())
                     } catch (e) {
                       console.error("USB bridge setup failed:", e)
                       setBridgeNotice("Ошибка подготовки USB-моста")
                     }
                   }
                   run()
                 } else {
                  // demo: симуляция через HTTP
                  setDataConnected(true)
                  // if (operationMode !== "record") dispatch(setOperationMode("record"))
                  // dispatch(startRecording())
                }
              }}
              onDisconnect={() => {
                setDataConnected(false)
                dispatch(stopRecording())
                if (dataMode === "demo" && currentCase?.id) {
                  // безопасно останавливаем только симуляцию
                  dispatch(stopSimulation(currentCase.id)).catch(() => {})
                }
                // WS-режим: ничего не останавливаем на бэке, только перестаем пуллить
                // USB-режим: аналогично — остановка только фронтового пуллинга
                setBridgeNotice(null)
              }}
            />

            {/* Кнопка "Как подключиться?" */}
            <button
              onClick={() => navigate(FRONTEND_PAGES.SYSTEM_GUIDE)}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-4"
              title="Инструкция по подключению оборудования"
            >
              <HelpCircle size={18} />
              <span className="whitespace-nowrap">Как подключиться?</span>
            </button>
        </div>
        {dataMode === "usb" && bridgeNotice && (
          <div className="text-sm mt-2 p-2 rounded bg-green-50 border border-green-200 text-green-700">
            {bridgeNotice}
          </div>
        )}

        {dataMode === "ws" && dataConnected && currentCase?.id && (
          <WsSensorUrl
              WS_BASE={WS_BASE}
              caseId={currentCase.id}
              horizonMin={horizonMin}
              strideSec={strideSec}
            />
        )}

        {/* Параметры работы модели */}
        <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-4">
          <div className="text-sm font-medium text-slate-700 mb-4">Параметры работы модели</div>
          
          <div className="flex flex-col space-y-4 max-w-md">
            {/* Выбор горизонта */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm text-slate-600">Временной промежуток прогнозирования</label>
              <div className="flex space-x-2">
                {H_OPTIONS.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorizonMin(h)}
                    disabled={operationMode === "playback" || dataConnected || !currentCase}
                    className={`px-3 py-2 text-sm rounded border transition-colors flex-1 ${
                      horizonMin === h 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {h} мин
                  </button>
                ))}
              </div>
            </div>

            {/* Выбор шага */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm text-slate-600">Время обновления предсказаний</label>
              <div className="flex space-x-2">
                {STRIDE_OPTIONS.map(s => (
                  <button 
                    key={s} 
                    type="button"
                    onClick={() => setStrideSec(s)}
                    disabled={operationMode === "playback" || dataConnected || !currentCase}
                    className={`px-3 py-2 text-sm rounded border transition-colors flex-1 ${
                      strideSec === s
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {s} сек
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>        

        <ModeSelector
          currentMode={operationMode}
          disabled={!currentCase}
          availableModes={availableModes}
          caseHasData={caseHasData}
        />

        <RecordingControls
          connected={dataConnected}
          wsActive={dataMode === "ws" && dataConnected}
          usbActive={dataMode === "usb" && dataConnected}
          onStopWs={() => {
            if (pollWsRef.current) { clearInterval(pollWsRef.current); pollWsRef.current = null }
            setDataConnected(false)
            setBridgeNotice(null)
          }}
        />
        {/* Риск-алерт (toast в правом верхнем углу) */}
        {operationMode !== "playback" && (
        <RiskAlertModal
          isOpen={showRiskAlert}
          onClose={() => setShowRiskAlert(false)}
          riskLevel={alertRiskLevel}
          currentData={rawPoints.at(-1)}
          alertAt={alertAt}
        />
        )}

        {currentCase ? (
        <>
        {/* ЧСС */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-medium text-gray-900">ЧСС (уд/мин)</h2>
            {!(operationMode === 'playback') && 
              <span className="font-semibold text-lg text-blue-600">
                {(rawPoints.at(-1)?.bpm ?? 0).toFixed(1)} bpm
              </span>
            } 
          </div>
          <div className="bg-slate-900 rounded-lg p-2 mt-2">
            {operationMode === "playback" ? (
            <PlotlyHistoryChart
              ref={bpmChartRef}
              points={rawPoints}
              dataKey="bpm"
              yLabel="ЧСС"
              height={200}
              showLegend={false}
              // useGL={rawPoints.length > 10000}
              useGL={false}
              yDynamic
              yPad={0.08}
              yClamp={[50, 210]}
              referenceLines={[{ y: 110, stroke: "#999", dash: "2 2", opacity: 0.7 }]}
              areaUnder={null} // или "bpm"
              alertKey="alert"
              alertFill="#ef4444"
              alertOpacity={0.12}
              alertLabel="ALERT"
            />
          ) : (
            <RealtimeLineChart
              data={displayData}
              timeWindow={timeWindow}
              series={[{ dataKey: "bpm", name: "ЧСС", type: "monotone", stroke: "#60A5FA" }]}
              yDynamic
              yClamp={[50, 210]}
              yLabel="ЧСС"
              height={200}
              isStatic={false}
              alertKey="alert"
            />
          )}
          </div>
        </section>

        {/* Маточная активность */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-medium text-gray-900">Маточная активность</h2>
            {!(operationMode === 'playback') &&
            <span className="font-semibold text-lg text-green-600">
              {(rawPoints.at(-1)?.uc ?? 0).toFixed(1)}
            </span>
            }
          </div>
          <div className="bg-slate-900 rounded-lg p-2 mt-2">
            {operationMode === "playback" ? (
            <PlotlyHistoryChart
              ref={ucChartRef}
              points={rawPoints}
              dataKey="uc"
              yLabel="МА"
              height={200}
              showLegend={false} 
              // useGL={rawPoints.length > 10000}
              useGL={false}
              yDynamic
              yPad={0.08}
              referenceLines={[{ y: 25, stroke: "#999", dash: "2 2", opacity: 0.7 }]}
              areaUnder={null}
              alertKey="alert"
              alertFill="#ef4444"
              alertOpacity={0.12}
              alertLabel="ALERT"
              stroke="#34D399" 
            />
          ) : (
            <RealtimeLineChart
              data={displayData}
              timeWindow={timeWindow}
              series={[{ dataKey: "uc", name: "МА", type: "monotone", stroke: "#34D399" }]}
              yDynamic
              yClamp={[0, 50]}
              yLabel="МА"
              height={200}
              isStatic={false}
              alertKey="alert"
            />
          )}
          </div>
        </section>

        {/* Вероятность осложнений */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-medium text-gray-900">Вероятность осложнений</h2>
            {!(operationMode === 'playback') && 
              <span className="font-semibold text-lg text-red-600">
                {`${((rawPoints.at(-1)?.risk ?? 0)* 100).toFixed(1)}%`}
              </span>
            }
          </div>
          <div className="bg-slate-900 rounded-lg p-2 mt-2">
            {operationMode === "playback" ? (
            <PlotlyHistoryChart
              ref={riskChartRef}
              points={rawPoints}
              dataKey="risk"
              yLabel="Риск"
              height={200}
              showLegend={false}
              // useGL={rawPoints.length > 10000}
              useGL={false}
              yDynamic
              yPad={0.08}
              yClamp={[0, 1]} 
              referenceLines={[{ y: RISK_THR, stroke: "#FCA5A5", dash: "2 2", opacity: 0.9 }]} // ← 0.5
              areaUnder={null}
              alertKey="alert"
              alertFill="#ef4444"
              alertOpacity={0.12}
              alertLabel="ALERT"
              stroke="#F87171"
            />
            ) : (
            <RealtimeLineChart
              data={displayData}
              timeWindow={timeWindow}
              series={[{ dataKey: "risk", name: "Риск", type: "monotone", stroke: "#F87171" }]}
              yDynamic
              yClamp={[0, 1]}
              yLabel="Риск"
              referenceLines={[{ y: RISK_THR, stroke: "#FCA5A5" }]}
              height={200}
              // isStatic={false}
              alertKey="alert"
            />
            )}
          </div>
        </section>

        {/* FIGO показатели */}
        <section className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium text-gray-900">Показатели FIGO</h2>
            <button
              onClick={() => setShowAdvancedFigo(!showAdvancedFigo)}
              className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title={showAdvancedFigo ? 'Скрыть дополнительные параметры' : 'Показать дополнительные параметры'}
            >
              {showAdvancedFigo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span className="text-s">{showAdvancedFigo ? 'Скрыть' : 'Развернуть'}</span>
            </button>
          </div>
          
          {/* Основные показатели */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <FigoStat 
              label="Базальный ритм, уд/мин"
              value={ figo?.baseline != null ? `${figo.baseline} bpm` : "—"}
              badge={ figo?.baselineClass } 
            />
            <FigoStat 
              label="Вариабельность, уд/мин" 
              value={ figo?.bpm_sd != null ? figo.bpm_sd  : "—" }
              badge={ figo?.varClass } 
            />
            <FigoStat 
              label="STV, мс" 
              value={figo?.stv != null ? figo.stv.toFixed(2) : "—"} 
              badge={figo?.stvClass}
            />
            <FigoStat 
              label="Акселерации" 
              value={ figo?.evtAccelTotal ?? "—" }
              badge={ figo?.accelClass } 
            />
            <FigoStat 
              label="Децелерации" 
              value={ figo?.evtDecelTotal ?? "—" } 
              badge={ figo?.decelerationsClass } 
            />
            <FigoStat 
              label="Ранние децелерации" 
              value={figo?.evtDecelEarly ?? "—"} 
              warning={figo?.evtDecelEarly > 0}
            />
            <FigoStat 
              label="Поздние децелерации" 
              value={figo?.evtDecelLate ?? "—"}
            />
            <FigoStat 
              label="Вариабельные децелерации" 
              value={figo?.evtDecelVariable ?? "—"} 
            />
            <FigoStat 
              label="Продолжительные децелерации" 
              value={figo?.evtDecelProlonged ?? "—"} 
            />
            <FigoStat 
              label="Тахикардия" 
              value={ figo?.evtTachyRatio ? "Да" : "Нет" }
              warning={ figo?.evtTachyRatio }
            />
            <FigoStat 
              label="Брадикардия" 
              value={ figo?.evtBradyRatio ? "Да" : "Нет" }
              warning={ figo?.evtBradyRatio } 
            />
            <FigoStat 
              label="Схватки (за окно)" 
              value={figo?.contractions ?? "—"} 
              badge={figo?.contractions > 0 ? "Активно" : "Отсутствуют"}
            />
          </div>

          {/* Расширенные показатели (появляются при раскрытии) */}
          {showAdvancedFigo && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <FigoStat 
                label="IQR ЧСС, уд/мин" 
                value={figo?.bpmIQR ?? "—"}
              />
              <FigoStat 
                label="Эпизоды низкой вар." 
                value={figo?.evtLowVarRatio > 0 ? "Да" : "Нет"}
              />
              <FigoStat 
                label="ЧСС при низкой вар., уд/мин" 
                value={figo?.evtLowVarMean ?? "—"}
              />
              <FigoStat 
                label="SD (общая), уд/мин" 
                value={figo?.evtSdOverall ?? "—"}
              />
              <FigoStat 
                label="RMSSD, уд/мин" 
                value={figo?.extraRMSSD ?? "—"}
              />
              <FigoStat 
                label="Poincaré SD1, уд/мин" 
                value={figo?.extraPoincareSD1 ?? "—"}
              />
              <FigoStat 
                label="Poincaré SD2, уд/мин" 
                value={figo?.extraPoincareSD2 ?? "—"}
              />
              <FigoStat 
                label="SD1/SD2" 
                value={figo?.extraSD1SD2Ratio ?? "—"}
              />
              <FigoStat 
                label="АКФ: лаг пика, с" 
                value={figo?.extraAcPeakLag ?? "—"}
              />
              <FigoStat 
                label="АКФ: время спада, с" 
                value={figo?.extraAcDecayTime ?? "—"}
              />
              </div>
            </div>
          )}
        </section>
          </>
        ) : (
          <div className="bg-white border border-gray-300 rounded-2xl p-8 text-center shadow-sm">
            <div className="text-gray-600 text-lg">
              Выберите пациента и исследование для начала работы
            </div>
            <div className="text-gray-500 text-sm mt-2">
              Создайте новое исследование для записи данных или выберите существующее для просмотра
            </div>
          </div>
        )}

         {operationMode === "playback" && rawPoints.length > 0 && (
            <button
              onClick={handleExportCharts}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              title="Экспорт графиков в HTML"
            >
              <Download size={18} />
              <span>Экспорт графиков</span>
            </button>
          )}
      </div>
    </div>
  )
}

function FigoStat({ label, value, badge }) {
  return (
    <div className="border border-gray-300 rounded-xl p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-base font-semibold text-gray-900">{value}</div>
      {badge && (
        <div 
          className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700}`}>
          {badge}
        </div>
      )}
    </div>
  )
}