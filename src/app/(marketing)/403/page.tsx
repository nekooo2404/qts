import type { Metadata } from 'next'

import { ErrorState } from '@/components/shared/error-state'

export const metadata: Metadata = {
  title: 'Không có quyền truy cập',
  robots: { index: false },
}

export default function ForbiddenPage() {
  return (
    <ErrorState
      code="403"
      title="Bạn không có quyền truy cập"
      description="Tài khoản hiện tại không được phép xem khu vực này. Dữ liệu vẫn được bảo vệ ở server."
    />
  )
}
