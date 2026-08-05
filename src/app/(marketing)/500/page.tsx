import type { Metadata } from 'next'

import { ErrorState } from '@/components/shared/error-state'

export const metadata: Metadata = {
  title: 'Lỗi hệ thống',
  robots: { index: false },
}

export default function ExplicitErrorPage() {
  return (
    <ErrorState
      code="500"
      title="Không thể xử lý yêu cầu"
      description="Trang trạng thái mẫu dùng khi hệ thống gặp lỗi không mong đợi. Chi tiết kỹ thuật không được công khai."
    />
  )
}
