import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, ReferenceLine, ResponsiveContainer } from 'recharts';

function RealtimeLineChart({ data, timeWindow, series, yDomain, yLabel, areaUnder, referenceLines, height = 200 }) {
  // Форматируем время в реальный формат чч:мм:сс
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('ru-RU', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const chartData = data.map(point => ({
    ...point,
    displayTime: formatTime(point.t)
  }));

  // Создаем деления для оси X с реальным временем (каждую минуту)
  const createTimeTicks = () => {
    const ticks = [];
    const timeRange = timeWindow[1] - timeWindow[0];

    // Интервал в 60 секунд (1 минута)
    const step = 60;

    // Начинаем с ближайшей минуты после начала временного окна
    const startTime = Math.ceil(timeWindow[0] / step) * step;

    for (let time = startTime; time <= timeWindow[1]; time += step) {
      ticks.push(time);
    }

    return ticks;
  };

  const timeTicks = createTimeTicks();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.3} />

        <XAxis
          dataKey="t"
          type="number"
          domain={[timeWindow[0], timeWindow[1]]}
          ticks={timeTicks}
          tickFormatter={formatTime}
          stroke="#9CA3AF"
          fontSize={10}
          tick={{ fill: '#9CA3AF' }}
          angle={0}
          textAnchor="middle"
        />

        <YAxis
          domain={yDomain}
          stroke="#9CA3AF"
          fontSize={10}
          tick={{ fill: '#9CA3AF' }}
          width={35}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            borderColor: '#374151',
            color: '#F9FAFB',
            fontSize: '12px'
          }}
          labelStyle={{ color: '#F9FAFB', fontSize: '12px' }}
          formatter={(value, name) => [value.toFixed(2), name]}
          labelFormatter={(label) => `Время: ${formatTime(label)}`}
        />

        <Legend />

        {referenceLines && referenceLines.map((line, index) => (
          <ReferenceLine
            key={index}
            y={line.y}
            stroke={line.stroke}
            strokeDasharray="2 2"
            strokeOpacity={0.7}
          />
        ))}

        {series.map((serie) => (
          <Line
            key={serie.dataKey}
            type={serie.type}
            dataKey={serie.dataKey}
            stroke={serie.stroke}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 1 }}
            name={serie.name}
            isAnimationActive={false}
            connectNulls={true}
          />
        ))}

        {areaUnder && series.find(s => s.dataKey === areaUnder) && (
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
  );
}

export default RealtimeLineChart;