import type { Metadata } from 'next'
import { CheckCircle2 } from 'lucide-react'

import { ContactForm } from '@/components/public/contact-form'
import { PageHero } from '@/components/public/page-hero'
import { createMetadata } from '@/lib/seo'

export const metadata: Metadata = createMetadata(
  'Liên hệ QTS',
  'Gửi nhu cầu tư vấn website, phần mềm, tích hợp hệ thống hoặc vận hành tới QTS Technology.',
  '/lien-he',
)

export default function ContactPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Liên hệ QTS"
        title="Bắt đầu bằng một cuộc trao đổi có đủ bối cảnh"
        description="Chia sẻ mục tiêu, người dùng và khó khăn hiện tại. QTS sẽ phản hồi qua kênh bạn cung cấp để xác định bước tiếp theo."
        breadcrumbs={[{ label: 'Liên hệ', href: '/lien-he' }]}
      />
      <section className="section contact-page">
        <div className="container contact-page__grid">
          <aside>
            <h2>Chuẩn bị trước khi gửi</h2>
            <p>
              Một yêu cầu có đủ bối cảnh giúp việc trao đổi tập trung vào đúng
              phạm vi ngay từ đầu.
            </p>
            <ul className="contact-page__guidance">
              {[
                ['Mục tiêu', 'Kết quả cần đạt và nhóm người dùng chính.'],
                [
                  'Hiện trạng',
                  'Quy trình, dữ liệu hoặc hệ thống đang sử dụng.',
                ],
                [
                  'Ràng buộc',
                  'Mốc thời gian, tích hợp và tiêu chí cần ưu tiên.',
                ],
              ].map(([title, description]) => (
                <li key={title}>
                  <CheckCircle2 size={19} aria-hidden="true" />
                  <span>
                    <strong>{title}</strong>
                    {description}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
          <div className="contact-page__form">
            <h2>Gửi yêu cầu liên hệ</h2>
            <ContactForm />
          </div>
        </div>
      </section>
      <section
        id="faq"
        className="section section--surface faq-section"
        aria-labelledby="faq-title"
      >
        <div className="container--narrow">
          <h2 id="faq-title">Câu hỏi thường gặp</h2>
          <details>
            <summary>QTS cần thông tin gì để bắt đầu tư vấn?</summary>
            <p>
              Mục tiêu, nhóm người dùng, quy trình hiện tại, khó khăn chính và
              thời gian mong muốn là những dữ liệu đầu vào hữu ích.
            </p>
          </details>
          <details>
            <summary>Form này có tạo báo giá tự động không?</summary>
            <p>
              Không. Chi phí chỉ được xác định sau khi hai bên làm rõ phạm vi,
              ràng buộc và tiêu chí nghiệm thu.
            </p>
          </details>
        </div>
      </section>
    </main>
  )
}
