import type { Metadata } from 'next'

import { CaseStudyCard } from '@/components/public/case-study-card'
import { PageHero } from '@/components/public/page-hero'
import { db } from '@/lib/db'
import { createMetadata } from '@/lib/seo'

export const metadata: Metadata = createMetadata(
  'Dự án và case study',
  'Các tình huống dự án demo minh họa cách QTS phân tích bài toán, thiết kế giải pháp và tổ chức triển khai.',
  '/du-an',
)

export default async function ProjectsPage() {
  const caseStudies = await db.caseStudy.findMany({
    where: { publishedAt: { not: null } },
    orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
  })

  return (
    <main id="main-content">
      <PageHero
        eyebrow="Dự án & case study"
        title="Cách tiếp cận được trình bày qua từng tình huống"
        description="Các case study hiện tại là dữ liệu demo, không đại diện cho khách hàng thật hoặc kết quả thương mại đã được xác nhận."
        breadcrumbs={[{ label: 'Dự án', href: '/du-an' }]}
        note="Dữ liệu demo - chờ nội dung dự án được phê duyệt"
      />
      <section className="section">
        <div className="container case-study-grid">
          {caseStudies.map((caseStudy, index) => (
            <CaseStudyCard
              caseStudy={caseStudy}
              index={index}
              key={caseStudy.id}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
