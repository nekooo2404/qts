'use client'

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

import { priorityLabels, statusLabels } from '@client/config/portal'

const pieColors = [
  'var(--color-brand)',
  'var(--color-data)',
  'var(--color-warning)',
  'var(--color-danger)',
]

export default function DashboardCharts({
  tasks,
  tickets,
}: {
  tasks: { status: string; value: number }[]
  tickets: { priority: string; value: number }[]
}) {
  const taskData = tasks.map((item) => ({
    ...item,
    label: statusLabels[item.status] ?? item.status,
  }))
  const ticketData = tickets.map((item) => ({
    ...item,
    label: priorityLabels[item.priority] ?? item.priority,
  }))
  return (
    <div className="dashboard-charts">
      {taskData.length > 0 && (
        <div
          className="dashboard-chart"
          role="img"
          aria-label="Biểu đồ số công việc theo trạng thái"
        >
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={taskData}
              margin={{ top: 8, right: 8, left: -20, bottom: 10 }}
            >
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  border: '1px solid var(--color-line)',
                  borderRadius: 6,
                  background: 'var(--color-surface)',
                  color: 'var(--color-ink)',
                }}
              />
              <Bar
                dataKey="value"
                name="Công việc"
                fill="var(--color-brand)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {ticketData.length > 0 && (
        <div
          className="dashboard-chart dashboard-chart--pie"
          role="img"
          aria-label="Biểu đồ ticket theo mức độ ưu tiên"
        >
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={ticketData}
                dataKey="value"
                nameKey="label"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={3}
                isAnimationActive={false}
              >
                {ticketData.map((item, index) => (
                  <Cell
                    fill={pieColors[index % pieColors.length]}
                    key={item.priority}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  border: '1px solid var(--color-line)',
                  borderRadius: 6,
                  background: 'var(--color-surface)',
                  color: 'var(--color-ink)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul>
            {ticketData.map((item, index) => (
              <li key={item.priority}>
                <span
                  style={{ background: pieColors[index % pieColors.length] }}
                />
                {item.label}
                <strong>{item.value}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
