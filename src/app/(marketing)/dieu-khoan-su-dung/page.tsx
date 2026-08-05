import type { Metadata } from 'next'

import { PageHero } from '@/components/public/page-hero'
import { createMetadata } from '@/lib/seo'

export const metadata: Metadata = createMetadata(
  'Điều khoản sử dụng',
  'Khung điều khoản sử dụng website và QTS Portal.',
  '/dieu-khoan-su-dung',
)

export default function TermsPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Thông tin pháp lý"
        title="Điều khoản sử dụng"
        description="Khung điều khoản cần được bộ phận pháp lý QTS rà soát trước khi công bố chính thức."
        breadcrumbs={[
          { label: 'Điều khoản sử dụng', href: '/dieu-khoan-su-dung' },
        ]}
        note="Ngày hiệu lực: [Điền ngày]"
      />
      <article className="legal-content container--narrow">
        <section>
          <h2>1. Phạm vi áp dụng</h2>
          <p>
            Điều khoản này áp dụng cho việc truy cập website QTS và sử dụng các
            chức năng trong QTS Portal.
          </p>
        </section>
        <section>
          <h2>2. Tài khoản Portal</h2>
          <p>
            Người dùng chịu trách nhiệm bảo vệ thông tin đăng nhập, không chia
            sẻ tài khoản và thông báo khi nghi ngờ truy cập trái phép.
          </p>
        </section>
        <section>
          <h2>3. Sử dụng hợp lệ</h2>
          <p>
            Không sử dụng hệ thống để truy cập dữ liệu ngoài phạm vi được cấp,
            gây gián đoạn dịch vụ hoặc tải lên nội dung vi phạm pháp luật.
          </p>
        </section>
        <section>
          <h2>4. Nội dung và dữ liệu demo</h2>
          <p>
            Các số liệu, khách hàng, dự án, hợp đồng và hóa đơn được đánh dấu
            demo không phải cam kết thương mại hoặc dữ liệu doanh nghiệp thật.
          </p>
        </section>
        <section>
          <h2>5. Trách nhiệm và thay đổi</h2>
          <p>
            Giới hạn trách nhiệm, luật áp dụng và quy trình thông báo thay đổi:
            [Điền nội dung pháp lý đã được phê duyệt].
          </p>
        </section>
      </article>
    </main>
  )
}
