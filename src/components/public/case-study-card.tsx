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
}

export function CaseStudyCard({ caseStudy }: CaseStudyCardProps) {
  return (
    <article className="case-study-card">
      <div className="case-study-card__visual" aria-hidden="true">
        <span>TÌNH HUỐNG MINH HỌA</span>
        <div>
          <i />
          <i />
          <i />
        </div>
        <strong>QTS</strong>
      </div>
      <div className="case-study-card__body">
        <span className="case-study-card__industry">
          {caseStudy.industry} · Kịch bản minh họa
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
            <dt>Đầu ra</dt>
            <dd>{caseStudy.outcome}</dd>
          </div>
        </dl>
        <Link className="inline-link" href={`/du-an/${caseStudy.slug}`}>
          Xem tình huống <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
