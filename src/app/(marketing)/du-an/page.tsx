import type { Metadata } from 'next'

import { CaseStudyCard } from '@client/components/public/case-study-card'
import { PageHero } from '@client/components/public/page-hero'
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
        eyebrow="Tình huống dự án"
        title="Cách tiếp cận được trình bày qua từng tình huống"
        description="Các kịch bản dưới đây minh họa cách phân tích bài toán, tổ chức giải pháp và xác định đầu ra. Chúng không đại diện cho khách hàng hoặc kết quả thương mại."
        breadcrumbs={[{ label: 'Dự án', href: '/du-an' }]}
        note="Không sử dụng tên khách hàng hoặc kết quả thương mại"
      />
      <section className="section">
        <div className="container case-study-grid">
          {caseStudies.map((caseStudy) => (
            <CaseStudyCard caseStudy={caseStudy} key={caseStudy.id} />
          ))}
        </div>
      </section>
    </main>
  )
}
