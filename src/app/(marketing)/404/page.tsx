import type { Metadata } from 'next'

import { ErrorState } from '@/components/shared/error-state'

export const metadata: Metadata = {
  title: 'Không tìm thấy trang',
  robots: { index: false },
}

export default function ExplicitNotFoundPage() {
  return (
    <ErrorState
      code="404"
      title="Không tìm thấy nội dung"
      description="Đường dẫn này không tồn tại hoặc nội dung chưa được xuất bản."
    />
  )
}
