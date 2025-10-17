// src/components/PlotlyHistoryChart.jsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import Plot from 'react-plotly.js'

// === Цвета/стили, совпадающие с Recharts-блоком на bg-slate-900 ===
export const COLORS = {
  paper: "#0f172a",    // bg-slate-900
  plot:  "#0f172a",    // однотонный
  axis:  "#9CA3AF",    // подписи осей/тиков
  grid:  "rgba(55,65,81,0.30)", // #374151 @ 30%
  tooltipBg: "#1F2937", // #1f2937
  tooltipBorder: "#374151",
  tooltipText: "#F9FAFB",
}

const toIso = (tSec) => new Date(tSec * 1000).toISOString()

/**
 * Вычисляем авто-диапазон Y как в RealtimeLineChart:
 * - по видимым точкам
 * - с паддингом yPad
 * - с «зажимом» [yClampMin, yClampMax], если задан
 */
function computeYRange(points, dataKey, { yDynamic, yPad, yClamp }) {
  if (!yDynamic || !points?.length) return undefined

  let vmin = +Infinity
  let vmax = -Infinity
  for (const p of points) {
    const v = p?.[dataKey]
    if (typeof v === "number" && isFinite(v)) {
      if (v < vmin) vmin = v
      if (v > vmax) vmax = v
    }
  }
  if (!isFinite(vmin) || !isFinite(vmax)) return undefined
  if (vmin === vmax) {
    vmin -= 1
    vmax += 1
  }

  const pad = Math.max(0, Math.min(0.5, yPad ?? 0.08))
  const span = vmax - vmin
  let ymin = vmin - span * pad
  let ymax = vmax + span * pad
  if (yClamp && Array.isArray(yClamp) && yClamp.length === 2) {
    ymin = Math.max(yClamp[0], ymin)
    ymax = Math.min(yClamp[1], ymax)
  }
  if (ymax - ymin < 1e-6) { ymin -= 0.5; ymax += 0.5 }
  return [ymin, ymax]
}

/**
 * Plotly-график для «истории» — стилизован под твой RealtimeLineChart.
 *
 * props:
 *  - points: [{ t, bpm?, uc?, risk?, [alertKey]?: 0|1|true|false }]
 *  - dataKey: "bpm" | "uc" | "risk"
 *  - yLabel: подпись оси Y
 *  - height: px (200 по умолчанию)
 *  - title: заголовок (опц.)
 *  - useGL: true => scattergl
 *
 *  - referenceLines: [{ y, stroke?, dash?, opacity? }]
 *  - areaUnder: dataKey для заливки (монолитная, как в Recharts)
 *  - alertKey / alertFill / alertOpacity / alertLabel: фоновые «полосы»
 *
 *  - yDynamic / yPad / yClamp: как в RealtimeLineChart
 */
export default function PlotlyHistoryChart({
  points,
  dataKey,
  yLabel = "",
  height = 200,
  title,
  useGL = false,
  showLegend = false, 
  stroke,

  referenceLines,
  areaUnder,
  alertKey,
  alertFill = "#ef4444",
  alertOpacity = 0.12,
  alertLabel = "ALERT",

  yDynamic = true,
  yPad = 0.08,
  yClamp,            // [min, max] | undefined
}) {
    const plotRef = useRef(null)
    const [isReady, setIsReady] = useState(false)

    // Упрощенная проверка данных
    const hasAnyY = useMemo(() => {
      if (!Array.isArray(points) || points.length === 0) return false
      return points.some(p => Number.isFinite(+p?.[dataKey]))
    }, [points, dataKey])

    // Автоматически устанавливаем ready при наличии данных
    useEffect(() => {
      if (hasAnyY) {
        // Небольшая задержка для гарантии инициализации DOM
        const timer = setTimeout(() => setIsReady(true), 100)
        return () => clearTimeout(timer)
      } else {
        setIsReady(false)
      }
    }, [hasAnyY])

  // Принудительный ререндер при изменении points
  useEffect(() => {
    if (hasAnyY && plotRef.current) {
      // Форсируем обновление layout при изменении данных
      plotRef.current.forceUpdate()
    }
  }, [points, hasAnyY])

  // Сырые серии X/Y
  const series = useMemo(() => {
    const x = points?.map((p) => toIso(p.t)) ?? []
    const y = points?.map((p) => (typeof p?.[dataKey] === "number" ? p[dataKey] : null)) ?? []
    return { x, y }
  }, [points, dataKey])

  // Диапазон Y по правилам RealtimeLineChart
  const yRange = useMemo(
    () => computeYRange(points, dataKey, { yDynamic, yPad, yClamp }),
    [points, dataKey, yDynamic, yPad, yClamp]
  )

  // Вычисляем alert-бэнды как непрерывные интервалы по alertKey
  const alertBands = useMemo(() => {
    if (!alertKey || !points?.length) return []
    const bands = []
    let start = null
    let prevT = null
    for (const p of points) {
      const active = Boolean(p?.[alertKey])
      const t = p.t
      if (active && start == null) start = t
      if (!active && start != null) {
        bands.push({ x1: start, x2: prevT ?? t })
        start = null
      }
      prevT = t
    }
    if (start != null) bands.push({ x1: start, x2: points.at(-1).t })
    return bands
  }, [points, alertKey])

  // Основной trace данных - полностью сохранена оригинальная логика
  const dataTrace = useMemo(() => {
    
    var hoverTemplate
    switch(dataKey) {
      case "bpm":
        hoverTemplate = 'Время: %{x|%H:%M:%S}<br>ЧСС: %{y:.1f}<extra></extra>'
        break
      case "uc":
        hoverTemplate = 'Время: %{x|%H:%M:%S}<br>МА: %{y:.1f}<extra></extra>'
        break
      case "risk":
        hoverTemplate = 'Время: %{x|%H:%M:%S}<br>Риск: %{y:.2f}<extra></extra>'
        break
      default:
        ""
    }

    const traceType = useGL ? "scattergl" : "scatter"
    const baseTrace = {
      x: series.x,
      y: series.y,
      type: traceType,
      mode: "lines",
      name: dataKey,
      line: { 
        width: 2, 
        ...(stroke ? { color: stroke } : {}) 
      },

      hovertemplate: hoverTemplate,
      connectgaps: true,  // аналог connectNulls
    }

    // Если надо залить под кривой, используем fill: "tozeroy" - оригинальная логика
    const traces = areaUnder === dataKey
       ? [{
           ...baseTrace,
           fill: "tozeroy",
           fillcolor: stroke
             ? `${stroke}26`   // #RRGGBB   0x26 ≈ ~15% прозрачности
             : "rgba(96,165,250,0.15)"
         }]
      : [baseTrace]

    return traces
  }, [series.x, series.y, useGL, dataKey, stroke, areaUnder])

  // Shapes для reference lines и alert bands - оригинальная логика
  const shapes = useMemo(() => {
    // Горизонтальные референсы — добавим как отдельные shape (как и в твоём компоненте)
    const refShapes = (referenceLines ?? []).map((line) => ({
      type: "line",
      xref: "paper", x0: 0, x1: 1,
      y0: line.y, y1: line.y,
      line: {
        color: line.stroke ?? "#999",
        width: 2,
        dash: line.dash ? "dot" : "dot", // ближе к "2 2"
      },
      opacity: line.opacity ?? 0.7,
    }))

    // Alert полосы — shapes с абсолютными датами (x0/x1 как ISO)
    const alertShapes = alertBands.map((b) => ({
      type: "rect",
      xref: "x", yref: "paper",
      x0: toIso(b.x1), x1: toIso(b.x2),
      y0: 0, y1: 1,   // на весь график по Y
      fillcolor: alertFill,
      opacity: alertOpacity,
      line: { width: 0 },
    }))

    return [...alertShapes, ...refShapes]
  }, [referenceLines, alertBands, alertFill, alertOpacity])

  // Layout configuration - исправлена конфигурация rangeslider
  const layout = useMemo(() => ({
    title: title || undefined,
    paper_bgcolor: COLORS.paper,
    plot_bgcolor: COLORS.plot,

    xaxis: {
      title: {text: "Время"},
      type: "date",
      color: COLORS.axis,
      tickfont: { color: COLORS.axis, size: 10 },
      titlefont: { color: COLORS.axis },
      gridcolor: COLORS.grid,
      showgrid: true,
      // Формат времени как у тебя в Recharts (локаль ru-RU)
      tickformat: "%H:%M:%S",
      rangeslider: { 
        visible: true,
        thickness: 0.30, // Толщина ползунка
        bgcolor: COLORS.paper,
        bordercolor: COLORS.grid,
      },
      // Автоматическое определение диапазона для ползунка
      autorange: true,
      fixedrange: false,

      // Показ вертикальных линий
      showspikes: true,          // включить спайк-линии
      spikecolor: COLORS.axis,     // цвет вертикальной линии
      spikethickness: 0.5,         // толщина линии
      spikedash: "dot",        // стиль линии (solid, dot, dash)
      spikemode: "across",       // линия across - через весь график
      spikesnap: "cursor",       // привязка к курсору
    },

    yaxis: {
      title: {text: yLabel || undefined},
      color: COLORS.axis,
      tickfont: { color: COLORS.axis, size: 10 },
      titlefont: { color: COLORS.axis },
      gridcolor: COLORS.grid,
      showgrid: true,
      rangemode: "normal",
      // Диапазон, если посчитали
      ...(yRange ? { range: yRange } : {}),
      fixedrange: false,
    },

    // Увеличиваем отступ снизу для ползунка
    margin: { t: 40, r: 20, b: 60, l: 50 },
    height,

    // Shapes: alert-бэнды + reference lines
    shapes,

    // Легенда выключена по умолчанию (как у тебя)
    showlegend: showLegend,
    legend: { 
      font: { color: COLORS.axis, size: 10 },
      x: 0,
      y: 1.1,
      orientation: 'h'
    },

    // Настройки перетаскивания и масштабирования
    dragmode: 'zoom',
    selectdirection: 'any',
  }), [title, yLabel, height, yRange, shapes, showLegend])

  // Config для Plotly - сохранена оригинальная конфигурация
  const config = useMemo(() => ({
    responsive: true,
    displaylogo: false,
    toImageButtonOptions: { 
      format: "png", 
      filename: "chart" 
    },
    modeBarButtonsToRemove: [
      "lasso2d", 
      "select2d",
      "autoScale2d", 
    ],
    // Добавляем кнопки для работы с ползунком
    modeBarButtonsToAdd: ['resetScale2d'],
  }), [])

  // Обработчик изменения диапазона
  const handleUpdate = (figure) => {
    setIsReady(true)
  }

  // Эффект для установки ready состояния
  useEffect(() => {
    if (hasAnyY) {
      setIsReady(true)
    } else {
      setIsReady(false)
    }
  }, [hasAnyY])

  // Если нет данных, показываем пустой контейнер как в оригинале
  if (!hasAnyY || !isReady) {
    return (
      <div 
        className="w-full rounded-lg" 
        style={{ height, backgroundColor: COLORS.paper }}
      />
    )
  }

  return (
    <Plot
      ref={plotRef}
      data={dataTrace}
      layout={layout}
      config={config}
      className="w-full rounded-lg"
      style={{ width: '100%', height }}
      onInitialized={() => setIsReady(true)}
      onUpdate={handleUpdate}
      useResizeHandler={true}
    />
  )
}