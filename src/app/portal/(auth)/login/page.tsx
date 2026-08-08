import Link from 'next/link'

import { LoginForm } from '@client/components/portal/login-form'
import { sanitizeNextPath } from '@/lib/security/request'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const query = await searchParams
  return (
    <div className="auth-page">
      <div className="auth-page__intro">
        <span className="eyebrow">Đăng nhập an toàn</span>
        <h1>Chào mừng trở lại QTS Portal</h1>
        <p>
          Sử dụng tài khoản QTS đã cấp để tiếp tục vào không gian làm việc của
          bạn.
        </p>
      </div>
      <LoginForm nextPath={sanitizeNextPath(query.next)} />
      <p className="auth-page__footer">
        Chưa có tài khoản? <Link href="/lien-he">Liên hệ đầu mối QTS</Link>
      </p>
    </div>
  )
}
