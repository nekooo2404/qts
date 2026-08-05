import type { Metadata } from 'next'

import { PageHero } from '@/components/public/page-hero'
import { ServiceCard } from '@/components/public/service-card'
import { serviceDetails } from '@/config/marketing'
import { createMetadata } from '@/lib/seo'

export const metadata: Metadata = createMetadata(
  'Dịch vụ công nghệ',
  'Dịch vụ thiết kế website, phát triển phần mềm, tích hợp hệ thống và bảo trì vận hành của QTS.',
  '/dich-vu',
)

export default function ServicesPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Dịch vụ QTS"
        title="Năng lực công nghệ gắn với từng giai đoạn vận hành"
        description="QTS đồng hành từ phân tích, thiết kế, phát triển đến tích hợp và hỗ trợ sau bàn giao, với phạm vi được xác nhận theo từng mốc."
        breadcrumbs={[{ label: 'Dịch vụ', href: '/dich-vu' }]}
      />
      <section className="section">
        <div className="container service-grid service-grid--listing">
          {Object.entries(serviceDetails).map(([slug, service]) => (
            <ServiceCard item={service} href={`/dich-vu/${slug}`} key={slug} />
          ))}
        </div>
      </section>
    </main>
  )
}
