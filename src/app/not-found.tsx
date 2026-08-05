import { ErrorState } from '@/components/shared/error-state'

export default function NotFound() {
  return (
    <ErrorState
      code="404"
      title="Không tìm thấy nội dung"
      description="Đường dẫn có thể đã thay đổi hoặc nội dung chưa được xuất bản. Hãy quay về trang chủ hoặc liên hệ QTS."
    />
  )
}
