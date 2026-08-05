import type { Metadata } from 'next'

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
        description="Khung chính sách đang chờ thông tin pháp lý và đầu mối dữ liệu của doanh nghiệp được xác nhận."
        breadcrumbs={[
          { label: 'Chính sách bảo mật', href: '/chinh-sach-bao-mat' },
        ]}
        note="Ngày hiệu lực: [Điền ngày]"
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
            liệu được kiểm tra tại server. Thời hạn lưu trữ chính thức: [Điền
            thời hạn].
          </p>
        </section>
        <section>
          <h2>4. Quyền của người dùng</h2>
          <p>
            Yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu có thể gửi đến [Điền
            email phụ trách dữ liệu]. Quy trình xử lý chính thức: [Điền thông
            tin].
          </p>
        </section>
        <section>
          <h2>5. Liên hệ</h2>
          <p>
            Đơn vị kiểm soát dữ liệu: Công ty Cổ phần Công nghệ QTS. Địa chỉ:
            [Điền địa chỉ]. Email: [Điền email].
          </p>
        </section>
      </article>
    </main>
  )
}
