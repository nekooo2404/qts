import type { Metadata } from 'next'
import Link from 'next/link'

import { PortalPreview } from '@/components/public/portal-preview'
import { QtsLogo } from '@/components/shared/qts-logo'

export const metadata: Metadata = {
  title: 'Đăng nhập QTS Portal',
  robots: { index: false, follow: false },
}

export default function PortalAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main id="main-content" className="portal-auth-layout">
      <section className="portal-auth-layout__form">
        <div className="portal-auth-layout__form-inner">
          <QtsLogo />
          <div>{children}</div>
          <p className="portal-auth-layout__legal">
            Chỉ dành cho tài khoản được cấp quyền.{' '}
            <Link href="/dieu-khoan-su-dung">Điều khoản sử dụng</Link>
          </p>
        </div>
      </section>
      <aside className="portal-auth-layout__visual">
        <div>
          <span className="eyebrow">QTS Portal</span>
          <h2>Mọi hoạt động dự án trong một không gian có phân quyền</h2>
          <p>
            Dự án, ticket, tài liệu, hợp đồng và thông báo được kết nối theo
            đúng vai trò.
          </p>
        </div>
        <PortalPreview compact />
        <small>Bản xem trước dùng dữ liệu demo.</small>
      </aside>
    </main>
  )
}
