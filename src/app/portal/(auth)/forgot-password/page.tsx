import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { ForgotPasswordForm } from '@client/components/portal/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="auth-page">
      <span className="eyebrow">Khôi phục truy cập</span>
      <h1>Quên mật khẩu</h1>
      <p>
        Nhập email tài khoản. Phản hồi luôn giống nhau để không tiết lộ tài
        khoản có tồn tại hay không.
      </p>
      <ForgotPasswordForm />
      <Link className="inline-link" href="/portal/login">
        <ArrowLeft size={16} /> Quay lại đăng nhập
      </Link>
    </div>
  )
}
