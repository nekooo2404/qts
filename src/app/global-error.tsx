'use client'

import { ErrorState } from '@/components/shared/error-state'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="vi">
      <body>
        <ErrorState
          code="500"
          title="QTS đang tạm gián đoạn"
          description="Không thể khởi tạo giao diện. Vui lòng thử lại hoặc liên hệ đầu mối hỗ trợ."
          reset={reset}
        />
      </body>
    </html>
  )
}
