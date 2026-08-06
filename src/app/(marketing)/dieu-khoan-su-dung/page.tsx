import type { Metadata } from 'next'
import Link from 'next/link'

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
        description="Các nguyên tắc sử dụng website và môi trường QTS Portal demo một cách phù hợp, an toàn và đúng phạm vi truy cập."
        breadcrumbs={[
          { label: 'Điều khoản sử dụng', href: '/dieu-khoan-su-dung' },
        ]}
        note="Cập nhật ngày 06/08/2026"
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
            QTS có thể điều chỉnh chức năng và dữ liệu trong môi trường demo để
            phục vụ kiểm thử. Phạm vi dịch vụ, trách nhiệm và cam kết thương mại
            chỉ có hiệu lực khi được hai bên thống nhất bằng văn bản. Câu hỏi về
            điều khoản có thể gửi qua{' '}
            <Link className="inline-link" href="/lien-he">
              biểu mẫu liên hệ
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  )
}
