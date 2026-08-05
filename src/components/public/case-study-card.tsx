import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

type CaseStudyCardProps = {
  caseStudy: {
    slug: string
    title: string
    excerpt: string
    challenge: string
    solution: string
    outcome: string
    industry: string
  }
  index?: number
}

export function CaseStudyCard({ caseStudy, index = 0 }: CaseStudyCardProps) {
  return (
    <article className="case-study-card">
      <div className="case-study-card__visual" aria-hidden="true">
        <span>DEMO / {String(index + 1).padStart(2, '0')}</span>
        <div>
          <i />
          <i />
          <i />
        </div>
        <strong>QTS</strong>
      </div>
      <div className="case-study-card__body">
        <span className="case-study-card__industry">
          {caseStudy.industry} · Dữ liệu demo
        </span>
        <h3>{caseStudy.title}</h3>
        <p>{caseStudy.excerpt}</p>
        <dl>
          <div>
            <dt>Bài toán</dt>
            <dd>{caseStudy.challenge}</dd>
          </div>
          <div>
            <dt>Giải pháp</dt>
            <dd>{caseStudy.solution}</dd>
          </div>
          <div>
            <dt>Kết quả</dt>
            <dd>{caseStudy.outcome}</dd>
          </div>
        </dl>
        <Link className="inline-link" href={`/du-an/${caseStudy.slug}`}>
          Xem case study <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
