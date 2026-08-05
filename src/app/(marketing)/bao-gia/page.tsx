import type { Metadata } from 'next'

import { PageHero } from '@/components/public/page-hero'
import { QuoteRequestForm } from '@/components/public/quote-request-form'
import { createMetadata } from '@/lib/seo'

export const metadata: Metadata = createMetadata(
  'Yêu cầu báo giá',
  'Gửi yêu cầu báo giá website, phần mềm, tích hợp hoặc QTS Portal. Phạm vi và chi phí sẽ được xác nhận sau trao đổi.',
  '/bao-gia',
)

export default function QuotePage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Yêu cầu báo giá"
        title="Cho QTS đủ bối cảnh để đề xuất đúng phạm vi"
        description="Biểu mẫu giúp thu thập thông tin ban đầu. Đây không phải báo giá tức thời hoặc cam kết chi phí."
        breadcrumbs={[{ label: 'Báo giá', href: '/bao-gia' }]}
      />
      <section className="section quote-page">
        <div className="container--narrow">
          <QuoteRequestForm />
        </div>
      </section>
    </main>
  )
}
