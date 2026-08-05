import type { Metadata } from 'next'

import { PageHero } from '@/components/public/page-hero'
import { TestimonialCard } from '@/components/public/testimonial-card'
import { customerPlaceholders } from '@/config/marketing'
import { createMetadata } from '@/lib/seo'

export const metadata: Metadata = createMetadata(
  'Khách hàng và câu chuyện thành công',
  'Khu vực dành cho logo, nhận xét và câu chuyện khách hàng QTS sau khi có nội dung được phê duyệt.',
  '/khach-hang',
)

export default function CustomersPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Khách hàng QTS"
        title="Niềm tin phải đến từ bằng chứng được xác nhận"
        description="Trang này đang dùng placeholder có chủ đích. QTS không hiển thị tên, logo hoặc trích dẫn của tổ chức khi chưa có quyền công bố."
        breadcrumbs={[{ label: 'Khách hàng', href: '/khach-hang' }]}
        note="Chưa có tên khách hàng thật được cung cấp"
      />
      <section className="section section--surface">
        <div className="container customer-directory">
          {customerPlaceholders.map((name, index) => (
            <span key={name}>
              0{index + 1} / {name}
            </span>
          ))}
        </div>
      </section>
      <section className="section" aria-labelledby="stories-title">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Khung câu chuyện</span>
            <h2 id="stories-title">
              Vị trí dành cho phản hồi đã được khách hàng duyệt
            </h2>
            <p>
              Các thẻ sau minh họa cấu trúc nội dung, không phải phát ngôn thật.
            </p>
          </div>
          <div className="testimonial-grid">
            {[
              [
                '[Khách hàng mẫu 01]',
                '[Vai trò người đại diện]',
                '[Trích dẫn sẽ được bổ sung sau khi khách hàng xác nhận nội dung và quyền công bố.]',
              ],
              [
                '[Tổ chức mẫu 02]',
                '[Vai trò người đại diện]',
                '[Phản hồi về quy trình triển khai, khả năng sử dụng và hỗ trợ sau bàn giao.]',
              ],
              [
                '[Doanh nghiệp mẫu 03]',
                '[Vai trò người đại diện]',
                '[Kết quả định lượng chỉ được đưa vào khi có nguồn dữ liệu và sự chấp thuận.]',
              ],
            ].map(([organization, role, quote]) => (
              <TestimonialCard
                organization={organization}
                role={role}
                quote={quote}
                key={organization}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
