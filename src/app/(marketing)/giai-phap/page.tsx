import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { PageHero } from '@client/components/public/page-hero'
import { solutionDetails } from '@client/config/marketing'
import { createMetadata } from '@/lib/seo'

export const metadata: Metadata = createMetadata(
  'Giải pháp theo lĩnh vực',
  'Giải pháp công nghệ QTS cho doanh nghiệp, giáo dục, thương mại, cơ quan và tổ chức.',
  '/giai-phap',
)

export default function SolutionsPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Giải pháp theo lĩnh vực"
        title="Một nền tảng kỹ thuật, nhiều bối cảnh vận hành khác nhau"
        description="QTS bắt đầu từ người dùng, quy trình và dữ liệu của từng tổ chức trước khi lựa chọn kiến trúc và lộ trình phù hợp."
        breadcrumbs={[{ label: 'Giải pháp', href: '/giai-phap' }]}
      />
      <section className="section">
        <div className="container solution-list">
          {Object.entries(solutionDetails).map(([slug, solution], index) => (
            <article key={slug}>
              <span className="solution-list__index">0{index + 1}</span>
              <div>
                <h2>{solution.name}</h2>
                <p>{solution.description}</p>
              </div>
              <ul>
                {solution.needs.map((need) => (
                  <li key={need}>{need}</li>
                ))}
              </ul>
              <Link className="inline-link" href={`/giai-phap/${slug}`}>
                Xem giải pháp <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
