'use client'

import dynamic from 'next/dynamic'

const DashboardCharts = dynamic(
  () => import('@client/components/portal/dashboard-charts'),
  {
    ssr: false,
    loading: () => (
      <div className="portal-chart-loading" aria-label="Đang tải biểu đồ">
        <span />
        <span />
      </div>
    ),
  },
)

export function LazyDashboardCharts(props: {
  tasks: { status: string; value: number }[]
  tickets: { priority: string; value: number }[]
}) {
  return <DashboardCharts {...props} />
}
