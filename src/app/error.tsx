'use client'

import { useEffect } from 'react'

import { ErrorState } from '@/components/shared/error-state'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('QTS route error', error.digest ?? error.name)
  }, [error])

  return (
    <ErrorState
      code="500"
      title="Không thể tải nội dung"
      description="Hệ thống gặp lỗi khi xử lý yêu cầu. Không có dữ liệu nhạy cảm hoặc chi tiết kỹ thuật được hiển thị tại đây."
      reset={reset}
    />
  )
}
