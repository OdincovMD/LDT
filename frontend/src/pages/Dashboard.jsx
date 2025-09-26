import React, { useEffect, useRef, useState } from "react";
import Controls from "../components/Controls";
import RealtimeLineChart from "../components/RealtimeLineChart";

// Константы
const MAX_SECONDS = 60*5; // 2 минуты
const TICK_MS = 1000;
const ANIMATION_INTERVAL_MS = 50;

function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState("demo");
  const [rawPoints, setRawPoints] = useState([]);
  const [interpolatedPoints, setInterpolatedPoints] = useState([]);
  const [currentTimeWindow, setCurrentTimeWindow] = useState([0, MAX_SECONDS]);
  const [initialPhase, setInitialPhase] = useState(true);

  const wsRef = useRef(null);
  const esRef = useRef(null);
  const timerRef = useRef(null);
  const animationRef = useRef(null);
  const lastRawPointRef = useRef(null);
  const startTimeRef = useRef(null);

  // Функция для парсинга времени
  const parseTs = (t) => typeof t === 'string' ? new Date(t).getTime() / 1000 : t;

  // Линейная интерполяция между двумя точками
  const interpolatePoints = (pointA, pointB, ratio) => {
    if (!pointA || !pointB) return pointB || pointA;

    return {
      t: pointA.t + (pointB.t - pointA.t) * ratio,
      bpm: pointA.bpm + (pointB.bpm - pointA.bpm) * ratio,
      uc: pointA.uc + (pointB.uc - pointA.uc) * ratio,
      risk: pointA.risk + (pointB.risk - pointA.risk) * ratio,
    };
  };

  // Добавление новой точки данных
  const pushPoint = (newPoint) => {
    setRawPoints(prev => {
      const updated = [...prev, newPoint];

      if (!startTimeRef.current) {
        startTimeRef.current = newPoint.t;
        setCurrentTimeWindow([startTimeRef.current, startTimeRef.current + MAX_SECONDS]);
      }

      lastRawPointRef.current = newPoint;
      return updated;
    });
  };

  // Функция интерполяции и обновления графика
  const updateInterpolatedData = () => {
    if (rawPoints.length < 1) {
      setInterpolatedPoints(rawPoints);
      return;
    }

    const now = Date.now() / 1000;
    const latestPoint = rawPoints[rawPoints.length - 1];

    let interpolatedPoint = latestPoint;

    // Интерполяция только если есть предыдущая точка и данные свежие
    if (rawPoints.length >= 2 && now - latestPoint.t < 2) {
      const prevPoint = rawPoints[rawPoints.length - 2];
      const timeSinceLastPoint = now - latestPoint.t;
      const timeBetweenPoints = latestPoint.t - prevPoint.t;

      const ratio = Math.min(1, timeSinceLastPoint / Math.max(0.1, timeBetweenPoints));
      interpolatedPoint = interpolatePoints(prevPoint, latestPoint, ratio);
    }

    // Создаем интерполированный набор данных
    const basePoints = rawPoints.slice(0, -1);
    setInterpolatedPoints([...basePoints, interpolatedPoint]);

    // Обновляем временное окно в зависимости от фазы
    const currentTime = now;
    const elapsedTime = currentTime - startTimeRef.current;

    if (initialPhase) {
      // Начальная фаза: график движется слева направо (как статические оси)
      if (elapsedTime <= MAX_SECONDS) {
        // Пока не прошла первая минута - двигаем окно вперед
        setCurrentTimeWindow([startTimeRef.current, startTimeRef.current + MAX_SECONDS]);
      } else {
        // Переключаемся на динамическую фазу после первой минуты
        setInitialPhase(false);
        const windowStart = Math.max(0, currentTime - MAX_SECONDS);
        const windowEnd = Math.max(MAX_SECONDS, currentTime);
        setCurrentTimeWindow([windowStart, windowEnd]);
      }
    } else {
      // Динамическая фаза: скользящее окно (как динамические оси)
      const windowStart = Math.max(0, currentTime - MAX_SECONDS);
      const windowEnd = Math.max(MAX_SECONDS, currentTime);
      setCurrentTimeWindow([windowStart, windowEnd]);
    }
  };

  // Очистка данных
  const clear = () => {
    setRawPoints([]);
    setInterpolatedPoints([]);
    setCurrentTimeWindow([0, MAX_SECONDS]);
    setInitialPhase(true);
    lastRawPointRef.current = null;
    startTimeRef.current = null;
  };

  // Запуск/остановка анимации
  useEffect(() => {
    if (connected && rawPoints.length > 0) {
      animationRef.current = setInterval(updateInterpolatedData, ANIMATION_INTERVAL_MS);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      setInterpolatedPoints(rawPoints);
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [connected, rawPoints.length, initialPhase]);

  // Подключение к источникам
  const connect = () => {
    if (connected) return;

    if (mode === "ws") {
      const ws = new WebSocket("wss://your-backend.example/ws/ctg");
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
      ws.onmessage = (ev) => {
        try {
          const m = JSON.parse(ev.data);
          pushPoint({ t: parseTs(m.t), bpm: m.bpm, uc: m.uc, risk: m.risk ?? null });
        } catch {}
      };
      wsRef.current = ws;
    } else if (mode === "sse") {
      const es = new EventSource("/api/stream/ctg");
      es.onopen = () => setConnected(true);
      es.onerror = () => setConnected(false);
      es.onmessage = (ev) => {
        try {
          const m = JSON.parse(ev.data);
          pushPoint({ t: parseTs(m.t), bpm: m.bpm, uc: m.uc, risk: m.risk ?? null });
        } catch {}
      };
      esRef.current = es;
    } else {
      // DEMO-генератор синтетики
      setConnected(true);
      const t0 = Date.now() / 1000;
      timerRef.current = setInterval(() => {
        const t = Date.now() / 1000;
        const dt = t - t0;
        const bpm = 140 + 10 * Math.sin(dt / 8) + 5 * Math.sin(dt / 1.7);
        const uc = 10 + 25 * Math.max(0, Math.sin(dt / 15)) + 5 * Math.sin(dt / 3);
        const risk = Math.min(1, Math.max(0, 0.2 + 0.3 * Math.sin(dt / 20) + 0.1 * Math.random()));
        pushPoint({ t, bpm, uc, risk });
      }, 1000);
    }
  };

  const disconnect = () => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (animationRef.current) { clearInterval(animationRef.current); animationRef.current = null; }
    setConnected(false);
  };

  // Автопереключение источника
  useEffect(() => {
    disconnect();
    clear();
  }, [mode]);

  // Фильтруем данные для отображения в текущем временном окне
  const displayData = interpolatedPoints.filter(point =>
    point.t >= currentTimeWindow[0] && point.t <= currentTimeWindow[1]
  );

  // Определяем текущий режим для отображения
  const getDisplayModeDescription = () => {
    if (!startTimeRef.current) return "Ожидание данных...";

    const elapsedTime = (Date.now() / 1000) - startTimeRef.current;

  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Кардиотокография</h1>
          <div className="flex items-center gap-4">
            <Controls
              connected={connected}
              onConnect={connect}
              onDisconnect={disconnect}
              onClear={clear}
              mode={mode}
              setMode={setMode}
            />
          </div>
        </header>

        <div className="text-sm text-slate-400">
          {getDisplayModeDescription()}
        </div>

        {/* График ЧСС */}
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
            series={[
              {
                dataKey: "bpm",
                name: "ЧСС",
                type: "monotone",
                stroke: "#60A5FA"
              }
            ]}
            yDomain={[50, 210]}
            yLabel="bpm"
            height={200}
          />
        </section>

        {/* График UC */}
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
              {(rawPoints.at(-1)?.risk ?? 0).toFixed(2)}
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
  );
}

export default Dashboard;