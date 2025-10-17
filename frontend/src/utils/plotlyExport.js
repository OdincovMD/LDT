// src/utils/plotlyExport.js

/**
 * Экспорт всех графиков Plotly в один HTML файл с идентичным отображением
 */
export const exportPlotlyToHtml = (chartsData, filename = 'charts_export.html') => {
  if (!chartsData || !chartsData.charts || chartsData.charts.length === 0) {
    console.error('No charts data to export')
    return
  }
  
  const htmlContent = generateHtmlContent(chartsData)
  downloadHtml(htmlContent, filename)
}

/**
 * Генерирует HTML контент с графиками, идентичными Dashboard
 */
const generateHtmlContent = (chartsData) => {
  const chartsHtml = chartsData.charts.map((chart, index) => `
    <div class="chart-section">
      <div class="chart-header">
        <h3 class="chart-title">${chart.title}</h3>
      </div>
      <div class="chart-container">
        <div id="chart-${index}" class="plotly-chart"></div>
      </div>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chartsData.metadata?.filename || 'Экспорт графиков КТГ'}</title>
    <script src="https://cdn.plot.ly/plotly-2.24.1.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: white;
            color: #1f2937;
            padding: 16px;
        }
        
        .export-header {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .export-title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .export-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin-top: 12px;
        }
        
        .info-item {
            font-size: 14px;
            color: #6b7280;
        }
        
        .info-value {
            font-weight: 600;
            color: #374151;
            margin-top: 2px;
        }
        
        .chart-section {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        
        .chart-title {
            font-size: 18px;
            font-weight: 500;
            color: #1f2937;
        }
        
        .chart-value {
            font-size: 18px;
            font-weight: 600;
        }
        
        .value-bpm { color: #3b82f6; }
        .value-uc { color: #10b981; }
        .value-risk { color: #ef4444; }
        
        .chart-container {
            background: #0f172a;
            border-radius: 8px;
            padding: 8px;
            margin-top: 8px;
        }
        
        .plotly-chart {
            width: 100%;
            border-radius: 4px;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 8px;
            }
            
            .chart-header {
                flex-direction: column;
                gap: 8px;
            }
            
            .export-info {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="export-header">
        <h1 class="export-title">Кардиотокография - Экспорт данных</h1>
        <div class="export-info">
            <div class="info-item">
                Пациент: <div class="info-value">${chartsData.metadata?.patientName || 'Не указан'}</div>
            </div>
            <div class="info-item">
                Исследование: <div class="info-value">${chartsData.metadata?.caseName || 'Не указано'}</div>
            </div>
            <div class="info-item">
                Дата экспорта: <div class="info-value">${new Date().toLocaleString('ru-RU')}</div>
            </div>
            <div class="info-item">
                Период записи: <div class="info-value">${chartsData.metadata?.recordingPeriod || 'Не указан'}</div>
            </div>
        </div>
    </div>
    
    ${chartsHtml}
    
    <script>
        // Данные графиков
        const chartsData = ${JSON.stringify(chartsData.charts)};
        
        // Инициализация графиков после загрузки страницы
        document.addEventListener('DOMContentLoaded', function() {
            if (!chartsData || !Array.isArray(chartsData)) {
                console.error('No charts data available');
                return;
            }
            
            chartsData.forEach((chart, index) => {
                try {
                    // Используем точные настройки layout из компонента
                    const layout = {
                        paper_bgcolor: '#0f172a',
                        plot_bgcolor: '#0f172a',
                        font: { 
                            color: '#9CA3AF',
                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        },
                        xaxis: {
                            title: { text: "Время" },
                            type: "date",
                            color: '#9CA3AF',
                            tickfont: { color: '#9CA3AF', size: 10 },
                            titlefont: { color: '#9CA3AF', size: 12 },
                            gridcolor: 'rgba(55,65,81,0.30)',
                            showgrid: true,
                            tickformat: "%H:%M:%S",
                            rangeslider: {
                                visible: true,
                                thickness: 0.30,
                                bgcolor: '#0f172a',
                                bordercolor: 'rgba(55,65,81,0.30)',
                            },
                            autorange: true,
                            fixedrange: false,
                        },
                        yaxis: {
                            title: { text: chart.layout.yaxis.title.text },
                            color: '#9CA3AF',
                            tickfont: { color: '#9CA3AF', size: 10 },
                            titlefont: { color: '#9CA3AF', size: 12 },
                            gridcolor: 'rgba(55,65,81,0.30)',
                            showgrid: true,
                            rangemode: "normal",
                            range: chart.layout.yaxis.range,
                            fixedrange: false,
                        },
                        margin: { t: 30, r: 20, b: 60, l: 50 },
                        height: 200,
                        showlegend: false,
                        dragmode: 'zoom',
                        selectdirection: 'any',
                        shapes: chart.layout.shapes || []
                    };
                    
                    Plotly.newPlot(
                        'chart-' + index,
                        chart.data,
                        layout,
                        { 
                            responsive: true,
                            displaylogo: false,
                            modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
                            modeBarButtonsToAdd: ['resetScale2d']
                        }
                    );
                    
                    console.log('Chart ' + index + ' initialized successfully');
                } catch (error) {
                    console.error('Error initializing chart ' + index + ':', error);
                }
            });
            
            // Добавляем обработчики для сохранения responsive поведения
            window.addEventListener('resize', function() {
                chartsData.forEach((chart, index) => {
                    const chartDiv = document.getElementById('chart-' + index);
                    if (chartDiv) {
                        Plotly.Plots.resize(chartDiv);
                    }
                });
            });
        });
    </script>
</body>
</html>
  `
}

/**
 * Сбор данных графиков для экспорта с идентичными настройками
 */
export const collectChartsData = (plotlyComponents, rawPoints, currentCase, currentPatient, operationMode) => {
  if (!rawPoints || rawPoints.length === 0) {
    console.warn('No raw points available for export')
    return null
  }
  
  console.log('Collecting charts data, points count:', rawPoints.length);
  
  // Используем те же данные, что и в компонентах PlotlyHistoryChart
  const charts = [
    createChartConfig('bpm', 'ЧСС (уд/мин)', '#60A5FA', 'value-bpm', rawPoints, [50, 210], [
      { y: 110, stroke: "#999", dash: "2 2", opacity: 0.7 }
    ]),
    createChartConfig('uc', 'Маточная активность', '#34D399', 'value-uc', rawPoints, [0, 50], [
      { y: 25, stroke: "#999", dash: "2 2", opacity: 0.7 }
    ]),
    createChartConfig('risk', 'Вероятность осложнений', '#F87171', 'value-risk', rawPoints, [0, 1], [
      { y: 0.7, stroke: "#FCA5A5", dash: "2 2", opacity: 0.9 }
    ])
  ]
  
  // Метаданные для файла
  const metadata = {
    patientName: currentPatient.name || 'Неизвестный пациент',
    caseName: `Исследование №${currentCase?.id}` || 'Исследование',
    filename: generateFilename(currentCase, currentPatient),
    recordingPeriod: getRecordingPeriod(rawPoints),
    pointsCount: rawPoints.length,
    exportDate: new Date().toLocaleString('ru-RU')
  }
  
  return {
    charts,
    metadata
  }
}

/**
 * Создание конфигурации для одного графика
 */
const createChartConfig = (dataKey, title, color, valueClass, points, yClamp, referenceLines) => {
  const lastPoint = points[points.length - 1]
  const lastValue = dataKey === 'bpm' 
    ? `${(lastPoint?.[dataKey] ?? 0).toFixed(1)} bpm`
    : (lastPoint?.[dataKey] ?? 0).toFixed(dataKey === 'risk' ? 2 : 1)
  
  // Создаем alert bands как в PlotlyHistoryChart
  const alertBands = createAlertBands(points)
  const shapes = createShapes(referenceLines, alertBands)
  
  return {
    title,
    type: dataKey,
    lastValue,
    valueClass,
    data: getChartData(points, dataKey, color),
    layout: getChartLayout(
      getYLabel(dataKey), 
      yClamp, 
      shapes,
      computeYRange(points, dataKey, { yDynamic: true, yPad: 0.08, yClamp })
    )
  }
}

/**
 * Создание alert bands как в PlotlyHistoryChart
 */
const createAlertBands = (points) => {
  if (!points || points.length === 0) return []
  
  const bands = []
  let start = null
  let prevT = null
  
  for (const p of points) {
    const active = Boolean(p?.alert)
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
}

/**
 * Создание shapes для reference lines и alert bands
 */
const createShapes = (referenceLines, alertBands) => {
  const toIso = (tSec) => new Date(tSec * 1000).toISOString()
  
  const refShapes = (referenceLines ?? []).map((line) => ({
    type: "line",
    xref: "paper", x0: 0, x1: 1,
    y0: line.y, y1: line.y,
    line: {
      color: line.stroke ?? "#999",
      width: 2,
      dash: "dot",
    },
    opacity: line.opacity ?? 0.7,
  }))

  const alertShapes = alertBands.map((b) => ({
    type: "rect",
    xref: "x", yref: "paper",
    x0: toIso(b.x1), x1: toIso(b.x2),
    y0: 0, y1: 1,
    fillcolor: "#ef4444",
    opacity: 0.12,
    line: { width: 0 },
  }))

  return [...alertShapes, ...refShapes]
}

/**
 * Вычисление Y диапазона как в PlotlyHistoryChart
 */
const computeYRange = (points, dataKey, { yDynamic, yPad, yClamp }) => {
  if (!yDynamic || !points?.length) return yClamp

  let vmin = +Infinity
  let vmax = -Infinity
  for (const p of points) {
    const v = p?.[dataKey]
    if (typeof v === "number" && isFinite(v)) {
      if (v < vmin) vmin = v
      if (v > vmax) vmax = v
    }
  }
  if (!isFinite(vmin) || !isFinite(vmax)) return yClamp
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
 * Получение подписи оси Y
 */
const getYLabel = (dataKey) => {
  switch(dataKey) {
    case 'bpm': return 'ЧСС'
    case 'uc': return 'МА'
    case 'risk': return 'Риск'
    default: return dataKey
  }
}

/**
 * Получение данных для графика
 */
const getChartData = (points, dataKey, color) => {
  const x = points.map(p => new Date(p.t * 1000))
  const y = points.map(p => p[dataKey])
  
  return [{
    x: x,
    y: y,
    type: 'scatter',
    mode: 'lines',
    name: dataKey,
    line: {
      color: color,
      width: 2
    },
    connectgaps: true
  }]
}

/**
 * Получение layout для графика
 */
const getChartLayout = (yLabel, yClamp, shapes, yRange) => ({
  xaxis: {
    title: { text: "Время" },
    type: "date",
    color: "#9CA3AF",
    tickfont: { color: "#9CA3AF", size: 10 },
    titlefont: { color: "#9CA3AF", size: 12 },
    gridcolor: "rgba(55,65,81,0.30)",
    showgrid: true,
    tickformat: "%H:%M:%S",
    rangeslider: {
      visible: true,
      thickness: 0.30,
      bgcolor: "#0f172a",
      bordercolor: "rgba(55,65,81,0.30)",
    },
    autorange: true,
    fixedrange: false,
  },
  yaxis: {
    title: { text: yLabel },
    color: "#9CA3AF",
    tickfont: { color: "#9CA3AF", size: 10 },
    titlefont: { color: "#9CA3AF", size: 12 },
    gridcolor: "rgba(55,65,81,0.30)",
    showgrid: true,
    rangemode: "normal",
    range: yRange || yClamp,
    fixedrange: false,
  },
  paper_bgcolor: "#0f172a",
  plot_bgcolor: "#0f172a",
  margin: { t: 30, r: 20, b: 60, l: 50 },
  height: 200,
  showlegend: false,
  dragmode: 'zoom',
  selectdirection: 'any',
  shapes: shapes
})

/**
 * Генерация названия файла с именем пациента
 */
const generateFilename = (currentCase, currentPatient) => {

  const patientName = currentPatient?.name || 'пациент'
  console.log(patientName)
  const caseName = `Исследование№${currentCase?.id}` || 'исследование'
  const date = new Date().toISOString().split('T')[0]
  
  // Очищаем имя пациента от недопустимых символов для имени файла
  const cleanName = patientName.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s_-]/g, '').trim()
  
  return `КТГ_${cleanName}_${caseName}_${date}.html`.replace(/\s+/g, '_')
}

/**
 * Получение периода записи из данных
 */
const getRecordingPeriod = (points) => {
  if (!points || points.length < 2) return 'Недостаточно данных'
  
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  
  const startTime = new Date(firstPoint.t * 1000)
  const endTime = new Date(lastPoint.t * 1000)
  
  return `${startTime.toLocaleTimeString('ru-RU')} - ${endTime.toLocaleTimeString('ru-RU')}`
}

/**
 * Скачивание HTML файла
 */
const downloadHtml = (content, filename) => {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}