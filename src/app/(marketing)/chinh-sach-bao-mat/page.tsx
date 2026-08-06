import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHero } from '@/components/public/page-hero'
import { createMetadata } from '@/lib/seo'

export const metadata: Metadata = createMetadata(
  'Chính sách bảo mật',
  'Khung chính sách thu thập và sử dụng dữ liệu trên website và QTS Portal.',
  '/chinh-sach-bao-mat',
)

export default function PrivacyPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Thông tin pháp lý"
        title="Chính sách bảo mật"
        description="Thông tin minh bạch về dữ liệu được thu thập, mục đích sử dụng và cách gửi yêu cầu liên quan đến dữ liệu."
        breadcrumbs={[
          { label: 'Chính sách bảo mật', href: '/chinh-sach-bao-mat' },
        ]}
        note="Cập nhật ngày 06/08/2026"
      />
      <article className="legal-content container--narrow">
        <section>
          <h2>1. Dữ liệu được thu thập</h2>
          <p>
            Website có thể thu thập thông tin bạn chủ động cung cấp qua form
            liên hệ, báo giá và đăng nhập, gồm họ tên, email, số điện thoại, đơn
            vị và nội dung yêu cầu.
          </p>
        </section>
        <section>
          <h2>2. Mục đích sử dụng</h2>
          <p>
            Dữ liệu được dùng để phản hồi yêu cầu, cung cấp chức năng portal,
            bảo vệ phiên đăng nhập và ghi nhận hoạt động quản trị cần thiết.
          </p>
        </section>
        <section>
          <h2>3. Lưu trữ và bảo vệ</h2>
          <p>
            Mật khẩu được băm; session dùng cookie HTTP-only; quyền truy cập dữ
            liệu được kiểm tra tại server. Bản demo chưa tự động xóa dữ liệu
            theo thời hạn, vì vậy không gửi thông tin nhạy cảm qua biểu mẫu.
          </p>
        </section>
        <section>
          <h2>4. Quyền của người dùng</h2>
          <p>
            Bạn có thể gửi yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu qua{' '}
            <Link className="inline-link" href="/lien-he">
              biểu mẫu liên hệ
            </Link>
            . QTS dùng kênh bạn cung cấp trong biểu mẫu để xác minh và phản hồi
            yêu cầu.
          </p>
        </section>
        <section>
          <h2>5. Liên hệ</h2>
          <p>
            Đơn vị vận hành website là Công ty Cổ phần Công nghệ QTS. Kênh tiếp
            nhận công khai hiện tại là{' '}
            <Link className="inline-link" href="/lien-he">
              trang liên hệ QTS
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  )
}
