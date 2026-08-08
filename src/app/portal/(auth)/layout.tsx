import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthSpatialScene } from '@client/components/portal/auth-spatial-scene'
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
          <div className="portal-auth-layout__brand-row">
            <QtsLogo />
            <span className="portal-auth-layout__access-status">
              <i aria-hidden="true" />
              Cổng nội bộ
            </span>
          </div>
          <div className="portal-auth-layout__content">{children}</div>
          <p className="portal-auth-layout__legal">
            Chỉ dành cho tài khoản được cấp quyền ·{' '}
            <Link
              href="/dieu-khoan-su-dung"
              aria-label="Đọc điều khoản sử dụng"
            >
              Điều khoản
            </Link>
          </p>
        </div>
      </section>
      <AuthSpatialScene />
    </main>
  )
}
