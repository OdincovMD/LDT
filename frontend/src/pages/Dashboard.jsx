import React, { useEffect, useRef, useState } from "react"
import Controls from "../components/Controls"
import RealtimeLineChart from "../components/RealtimeLineChart"

// Константы
const MAX_SECONDS = 60 // 1 минута
const TICK_MS = 1000

function Dashboard() {
  const [connected, setConnected] = useState(false)
  const [mode, setMode] = useState("demo") // 'ws' | 'sse' | 'demo'
  const [points, setPoints] = useState([])
  const [currentTimeWindow, setCurrentTimeWindow] = useState([0, MAX_SECONDS])

  const wsRef = useRef(null)
  const esRef = useRef(null)
  const timerRef = useRef(null)

  // Функция для парсинга времени
  const parseTs = (t) => typeof t === 'string' ? new Date(t).getTime() / 1000 : t

  // Добавление точки данных - всегда центрируем на последней точке
  const pushPoint = (newPoint) => {
    setPoints(prev => {
      const updated = [...prev, newPoint]
      // Обрезаем старые данные (последняя минута)
      const cutoff = Date.now() / 1000 - MAX_SECONDS
      const filtered = updated.filter(p => p.t >= cutoff)

      // Всегда центрируем окно на последней точке
      const latestTime = newPoint.t
      const windowStart = latestTime - MAX_SECONDS / 2
      const windowEnd = latestTime + MAX_SECONDS / 2
      setCurrentTimeWindow([windowStart, windowEnd])

      return filtered
    })
  }

  // Очистка данных
  const clear = () => {
    setPoints([])
    setCurrentTimeWindow([0, MAX_SECONDS])
  }

  // Подключение к источникам
  const connect = () => {
    if (connected) return

    if (mode === "ws") {
      const ws = new WebSocket("wss://your-backend.example/ws/ctg")
      ws.onopen = () => setConnected(true)
      ws.onclose = () => setConnected(false)
      ws.onerror = () => setConnected(false)
      ws.onmessage = (ev) => {
        try {
          const m = JSON.parse(ev.data)
          pushPoint({ t: parseTs(m.t), bpm: m.bpm, uc: m.uc, risk: m.risk ?? null })
        } catch {}
      }
      wsRef.current = ws
    } else if (mode === "sse") {
      const es = new EventSource("/api/stream/ctg")
      es.onopen = () => setConnected(true)
      es.onerror = () => setConnected(false)
      es.onmessage = (ev) => {
        try {
          const m = JSON.parse(ev.data)
          pushPoint({ t: parseTs(m.t), bpm: m.bpm, uc: m.uc, risk: m.risk ?? null })
        } catch {}
      }
      esRef.current = es
    } else {
      // DEMO-генератор синтетики (локально в браузере)
      setConnected(true)
      const t0 = Date.now() / 1000
      timerRef.current = setInterval(() => {
        const t = Date.now() / 1000
        const dt = t - t0
        // игрушечные сигналы
        const bpm = 140 + 10 * Math.sin(dt / 8) + 5 * Math.sin(dt / 1.7)
        const uc = 10 + 25 * Math.max(0, Math.sin(dt / 15)) + 5 * Math.sin(dt / 3)
        const risk = Math.min(1, Math.max(0, 0.2 + 0.3 * Math.sin(dt / 20) + 0.1 * Math.random()))
        pushPoint({ t, bpm, uc, risk })
      }, 1000)
    }
  }

  const disconnect = () => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setConnected(false)
  }

  // Автопереключение источника
  useEffect(() => {
    disconnect()
    clear()
  }, [mode])

  // Фильтруем данные для отображения в текущем временном окне
  const displayData = points.filter(point =>
    point.t >= currentTimeWindow[0] && point.t <= currentTimeWindow[1]
  )

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Кардиотокография</h1>
          <Controls
            connected={connected}
            onConnect={connect}
            onDisconnect={disconnect}
            onClear={clear}
            mode={mode}
            setMode={setMode}
          />
        </header>

        {/* График FHR (bpm) */}
        <section className="bg-slate-800 rounded-2xl p-4 shadow">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg">ЧСС (уд/мин)</h2>
            <span style={{ color: '#60A5FA' }} className="font-semibold text-lg">
              {(points.at(-1)?.bpm ?? 0).toFixed(1)} ЧСС
            </span>
          </div>
          <RealtimeLineChart
            data={displayData}
            timeWindow={currentTimeWindow}
            series={[
              {
                dataKey: "bpm",
                name: "ЧСС",
                type: "monotone",
                stroke: "#60A5FA"
              }
            ]}
            yDomain={[50, 210]}
            yLabel="ЧСС"
            height={200}
          />
        </section>

        {/* График UC */}
        <section className="bg-slate-800 rounded-2xl p-4 shadow">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg">Маточная активность</h2>
            <span style={{ color: '#34D399' }} className="font-semibold text-lg">
              {(points.at(-1)?.uc ?? 0).toFixed(1)}
            </span>
          </div>
          <RealtimeLineChart
            data={displayData}
            timeWindow={currentTimeWindow}
            series={[
              {
                dataKey: "uc",
                name: "UC",
                type: "monotone",
                stroke: "#34D399"
              }
            ]}
            yDomain={[0, 50]}
            yLabel="UC"
            height={200}
          />
        </section>

        {/* График риска */}
        <section className="bg-slate-800 rounded-2xl p-4 shadow">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg">Вероятность развития осложнений (5 минут)</h2>
            <span style={{ color: '#F87171' }} className="font-semibold text-lg">
              {(points.at(-1)?.risk ?? 0).toFixed(2)}
            </span>
          </div>
          <RealtimeLineChart
            data={displayData}
            timeWindow={currentTimeWindow}
            series={[
              {
                dataKey: "risk",
                name: "Риск",
                type: "monotone",
                stroke: "#F87171"
              }
            ]}
            yDomain={[0, 1]}
            yLabel="risk"
            referenceLines={[
              {
                y: 0.5,
                label: "порог 0.5",
                stroke: "#FCA5A5"
              }
            ]}
            height={200}
          />
        </section>
      </div>
    </div>
  )
}

export default Dashboard