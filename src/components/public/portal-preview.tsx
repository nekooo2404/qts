import {
  Bell,
  BriefcaseBusiness,
  CircleCheck,
  FileText,
  LifeBuoy,
  ListTodo,
} from 'lucide-react'

import { cn } from '@/lib/utils'

type PortalPreviewProps = {
  compact?: boolean
}

export function PortalPreview({ compact = false }: PortalPreviewProps) {
  return (
    <div
      className={cn('portal-preview', compact && 'portal-preview--compact')}
      role="img"
      aria-label="Bản xem trước giao diện QTS Portal"
    >
      <aside className="portal-preview__sidebar" aria-hidden="true">
        <span className="portal-preview__brand">Q</span>
        {[BriefcaseBusiness, ListTodo, LifeBuoy, FileText].map(
          (Icon, index) => (
            <span className={index === 0 ? 'is-active' : undefined} key={index}>
              <Icon size={compact ? 12 : 15} />
            </span>
          ),
        )}
      </aside>
      <div className="portal-preview__stage">
        <header className="portal-preview__header">
          <div>
            <small>Tổng quan vận hành</small>
            <strong>Xin chào, doanh nghiệp demo</strong>
          </div>
          <span className="portal-preview__notification">
            <Bell size={compact ? 12 : 15} aria-hidden="true" />
            <i aria-hidden="true" />
          </span>
        </header>
        <div className="portal-preview__metrics">
          <div>
            <span>Dự án đang chạy</span>
            <strong>03</strong>
            <small>Dữ liệu demo</small>
          </div>
          <div>
            <span>Tiến độ tổng</span>
            <strong>58%</strong>
            <small>Cập nhật theo mốc</small>
          </div>
          <div>
            <span>Ticket mở</span>
            <strong>02</strong>
            <small>01 ưu tiên cao</small>
          </div>
        </div>
        <div className="portal-preview__workspace">
          <section className="portal-preview__chart">
            <div className="portal-preview__panel-title">
              <strong>Tiến độ dự án</strong>
              <span>6 tháng</span>
            </div>
            <div className="portal-preview__bars" aria-hidden="true">
              {[34, 48, 43, 62, 74, 82, 68, 88].map((height, index) => (
                <i
                  key={index}
                  style={
                    { '--bar-height': `${height}%` } as React.CSSProperties
                  }
                />
              ))}
            </div>
            <div className="portal-preview__axis" aria-hidden="true">
              <span>T1</span>
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
            </div>
          </section>
          <section className="portal-preview__activity">
            <div className="portal-preview__panel-title">
              <strong>Công việc gần đây</strong>
              <span>4 việc</span>
            </div>
            {[
              ['Duyệt luồng nghiệp vụ', 'Hoàn tất'],
              ['Dashboard theo vai trò', '64%'],
              ['Rà soát ticket', 'Đang duyệt'],
            ].map(([label, value], index) => (
              <div className="portal-preview__task" key={label}>
                <CircleCheck
                  size={compact ? 11 : 14}
                  className={index === 0 ? 'is-done' : undefined}
                  aria-hidden="true"
                />
                <span>{label}</span>
                <small>{value}</small>
              </div>
            ))}
          </section>
        </div>
        <div className="portal-preview__ticket">
          <LifeBuoy size={compact ? 12 : 15} aria-hidden="true" />
          <span>
            <strong>TK-2026-001</strong> Kiểm tra dữ liệu dashboard
          </span>
          <small>Đã tiếp nhận</small>
        </div>
      </div>
    </div>
  )
}
