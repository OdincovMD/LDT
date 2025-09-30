/**
 * @component RealtimeLineChart
 * @description Компонент графика для отображения временных рядов в реальном времени. Поддерживает множественные серии, алерты, динамические оси и референсные линии.
 */
// components/RealtimeLineChart.jsx
import React, { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area,
  ReferenceLine, ReferenceArea, ResponsiveContainer
} from 'recharts'

/**
 * Универсальный компонент временного ряда.
 * data: [{ t: unix_sec, ...seriesKeys, [alertKey]: 0|1|true|false }]
 */
function RealtimeLineChart({
  data,
  timeWindow,               // [tMin, tMax] в секундах
  series,                   // [{ dataKey, name, type='monotone', stroke }]
  yDomain,                  // [min, max] | ['auto','auto'] | undefined
  yLabel,
  areaUnder,                // dataKey, для которого рисуем заливку
  referenceLines,           // [{ y, stroke, dash='2 2', opacity=0.7 }]
  height = 200,
  isStatic = false,

  // НОВОЕ: динамическая ось Y
  yDynamic = true,          // если true и yDomain не задан — считаем по окну
  yPad = 0.08,              // паддинг 8% сверху/снизу
  yClamp,                   // опционально "зажать": [minClamp, maxClamp]

  // НОВОЕ: подсветка алертов
  alertKey,                 // имя поля в точке (например, 'alert')
  alertFill = '#ef4444',
  alertOpacity = 0.12,
  alertLabel = 'ALERT',
}) {
  const formatTime = (tsSec) => {
    const date = new Date(tsSec * 1000)
    return date.toLocaleTimeString('ru-RU', { hour12: false })
  }

  // Данные в текущем окне, чтобы и ось и алерты считались по видимой области
  const windowed = useMemo(() => {
    if (!Array.isArray(data) || !timeWindow) return []
    const [t0, t1] = timeWindow
    return data.filter(p => typeof p?.t === 'number' && p.t >= t0 && p.t <= t1)
  }, [data, timeWindow])

  // Авто-диапазон Y по выбранным сериям
  const autoYDomain = useMemo(() => {
    if (yDomain) return yDomain
    if (!yDynamic || !windowed.length || !Array.isArray(series) || series.length === 0) {
      return ['auto', 'auto']
    }
    let vmin = +Infinity
    let vmax = -Infinity
    for (const p of windowed) {
      for (const s of series) {
        const v = p?.[s.dataKey]
        if (typeof v === 'number' && isFinite(v)) {
          if (v < vmin) vmin = v
          if (v > vmax) vmax = v
        }
      }
    }
    if (!isFinite(vmin) || !isFinite(vmax)) return ['auto', 'auto']
    if (vmin === vmax) {
      // плоская линия — слегка раздвинем
      vmin -= 1
      vmax += 1
    }
    const pad = Math.max(0, Math.min(0.5, yPad))
    const span = vmax - vmin
    let ymin = vmin - span * pad
    let ymax = vmax + span * pad
    if (yClamp && Array.isArray(yClamp) && yClamp.length === 2) {
      ymin = Math.max(yClamp[0], ymin)
      ymax = Math.min(yClamp[1], ymax)
    }
    // защита от вырождения
    if (ymax - ymin < 1e-6) {
      ymin -= 0.5
      ymax += 0.5
    }
    return [ymin, ymax]
  }, [yDomain, yDynamic, yPad, yClamp, windowed, series])

  // Генератор тиков по времени
  const timeTicks = useMemo(() => {
    if (!timeWindow || timeWindow.length !== 2) return []
    const [t0, t1] = timeWindow
    if (t1 <= t0) return [t0]
    const range = t1 - t0
    if (isStatic) {
      const n = 5
      const step = range / n
      return Array.from({ length: n + 1 }, (_, i) => Math.round(t0 + i * step))
    }
    const rawStep = 60
    const maxTicks = 12
    const k = Math.max(1, Math.ceil(range / (rawStep * maxTicks)))
    const step = rawStep * k
    const start = Math.ceil(t0 / step) * step
    const ticks = []
    for (let t = start; t <= t1; t += step) ticks.push(t)
    return ticks
  }, [timeWindow, isStatic])

  // Сегменты алертов (непрерывные интервалы, где alertKey истинный)
  const alertBands = useMemo(() => {
    if (!alertKey || windowed.length === 0) return []
    const bands = []
    let start = null
    let prevT = null
    for (const p of windowed) {
      const active = Boolean(p?.[alertKey])
      const t = p.t
      if (active && start == null) {
        start = t
      }
      if (!active && start != null) {
        // завершили полосу
        bands.push({ x1: start, x2: prevT ?? t })
        start = null
      }
      prevT = t
    }
    if (start != null) {
      bands.push({ x1: start, x2: windowed.at(-1).t })
    }
    return bands
  }, [windowed, alertKey])

  const fmtVal = (v) => (typeof v === 'number' && isFinite(v) ? v.toFixed(2) : String(v))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={windowed} margin={{ top: 6, right: 16, left: 16, bottom: 6 }}>
        <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.3} />

        {/* Подсветка алертов фоном */}
        {alertBands.map((b, i) => (
          <ReferenceArea
            key={`alert-${i}`}
            x1={b.x1}
            x2={b.x2}
            y1={autoYDomain[0]}
            y2={autoYDomain[1]}
            stroke="none"
            fill={alertFill}
            fillOpacity={alertOpacity}
            ifOverflow="extendDomain"
            label={alertLabel ? { value: alertLabel, position: 'insideTopLeft', fontSize: 10, fill: '#ef9a9a' } : undefined}
          />
        ))}

        <XAxis
          dataKey="t"
          type="number"
          domain={timeWindow}
          ticks={timeTicks}
          tickFormatter={formatTime}
          stroke="#9CA3AF"
          fontSize={10}
          tick={{ fill: '#9CA3AF' }}
          angle={0}
          textAnchor="middle"
        />

        <YAxis
          domain={autoYDomain}
          stroke="#9CA3AF"
          fontSize={10}
          tick={{ fill: '#9CA3AF' }}
          width={40}
          label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', offset: -5} : null}
          tickFormatter={(val) => {
            // если дробное значение — округляем до 1 знака, иначе целое
            return Number.isInteger(val) 
              ? val.toString() 
              : val.toFixed(1);
          }}
        />


        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            borderColor: '#374151',
            color: '#F9FAFB',
            fontSize: '12px'
          }}
          labelStyle={{ color: '#F9FAFB', fontSize: '12px' }}
          formatter={(value, name) => [fmtVal(value), name]}
          labelFormatter={(label) => `Время: ${formatTime(label)}`}
        />

        <Legend />

        {Array.isArray(referenceLines) && referenceLines.map((line, idx) => (
          <ReferenceLine
            key={idx}
            y={line.y}
            stroke={line.stroke ?? '#999'}
            strokeDasharray={line.dash ?? '2 2'}
            strokeOpacity={line.opacity ?? 0.7}
          />
        ))}

        {series.map((s) => (
          <Line
            key={s.dataKey}
            type={s.type ?? 'monotone'}
            dataKey={s.dataKey}
            stroke={s.stroke}
            strokeWidth={2}
            dot={isStatic}
            activeDot={isStatic ? { r: 4 } : { r: 3, strokeWidth: 1 }}
            name={s.name}
            isAnimationActive={isStatic}
            connectNulls
          />
        ))}

        {areaUnder && series.some(s => s.dataKey === areaUnder) && (
          <Area
            type="monotone"
            dataKey={areaUnder}
            stroke="none"
            fill={series.find(s => s.dataKey === areaUnder).stroke}
            fillOpacity={0.15}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

export default RealtimeLineChart
