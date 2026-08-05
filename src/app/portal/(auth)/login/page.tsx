import Link from 'next/link'

import { LoginForm } from '@/components/portal/login-form'
import { sanitizeNextPath } from '@/lib/security/request'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const query = await searchParams
  return (
    <div className="auth-page">
      <span className="eyebrow">Đăng nhập an toàn</span>
      <h1>Chào mừng trở lại QTS Portal</h1>
      <p>
        Sử dụng tài khoản đã được QTS cấp. Thông tin demo chỉ được công bố trong
        README.
      </p>
      <LoginForm nextPath={sanitizeNextPath(query.next)} />
      <p className="auth-page__footer">
        Chưa có tài khoản? <Link href="/lien-he">Liên hệ đầu mối QTS</Link>
      </p>
    </div>
  )
}
