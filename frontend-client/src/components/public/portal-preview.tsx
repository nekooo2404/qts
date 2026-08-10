import {
  Bell,
  BriefcaseBusiness,
  CircleCheck,
  FileText,
  LifeBuoy,
  ListTodo,
} from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

type PortalPreviewProps = {
  compact?: boolean
}

export function PortalPreview({ compact = false }: PortalPreviewProps) {
  return (
    <div
      className={cn('portal-preview', compact && 'portal-preview--compact')}
      role="img"
      aria-label="Bố cục minh họa giao diện QTS Portal"
    >
      <aside className="portal-preview__sidebar" aria-hidden="true">
        <span className="portal-preview__brand">
          <Image src="/brand/qts-shield.png" alt="" width={32} height={39} />
        </span>
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
            <strong>Không gian dự án</strong>
          </div>
          <span className="portal-preview__notification">
            <Bell size={compact ? 12 : 15} aria-hidden="true" />
            <i aria-hidden="true" />
          </span>
        </header>
        <div className="portal-preview__metrics">
          <div>
            <span>Dự án</span>
            <strong>Đang chạy</strong>
            <small>Có người phụ trách</small>
          </div>
          <div>
            <span>Bàn giao</span>
            <strong>Theo mốc</strong>
            <small>Có đầu ra rõ ràng</small>
          </div>
          <div>
            <span>Hỗ trợ</span>
            <strong>Đã nhận</strong>
            <small>Có lịch sử xử lý</small>
          </div>
        </div>
        <div className="portal-preview__workspace">
          <section className="portal-preview__milestones">
            <div className="portal-preview__panel-title">
              <strong>Luồng triển khai</strong>
              <span>Theo từng mốc</span>
            </div>
            <div className="portal-preview__milestone-track" aria-hidden="true">
              {['Khảo sát', 'Thiết kế', 'Xây dựng', 'Vận hành'].map((label) => (
                <span key={label}>
                  <i />
                  {label}
                </span>
              ))}
            </div>
          </section>
          <section className="portal-preview__activity">
            <div className="portal-preview__panel-title">
              <strong>Công việc gần đây</strong>
              <span>Theo trạng thái</span>
            </div>
            {[
              ['Xác nhận luồng nghiệp vụ', 'Đã thống nhất'],
              ['Rà soát giao diện theo vai trò', 'Đang xử lý'],
              ['Kiểm tra dữ liệu đầu vào', 'Chờ xác nhận'],
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
            <strong>Yêu cầu hỗ trợ</strong> Kiểm tra dữ liệu dashboard
          </span>
          <small>Đã tiếp nhận</small>
        </div>
      </div>
    </div>
  )
}
