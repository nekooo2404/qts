import Link from 'next/link'
import { ArrowRight, Check, CircleDot } from 'lucide-react'

import { PageHero } from '@client/components/public/page-hero'
import { SectionHeading } from '@client/components/public/section-heading'
import { buttonVariants } from '@/components/ui/button'
import { implementationProcess } from '@client/config/marketing'
import { cn } from '@/lib/utils'

type OfferingDetailProps = {
  eyebrow: string
  title: string
  description: string
  parentLabel: string
  parentHref: string
  pathname: string
  benefits: readonly string[]
  deliverables?: readonly string[]
  status?: string
}

export function OfferingDetail({
  eyebrow,
  title,
  description,
  parentLabel,
  parentHref,
  pathname,
  benefits,
  deliverables = [],
  status,
}: OfferingDetailProps) {
  return (
    <main id="main-content">
      <PageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={[
          { label: parentLabel, href: parentHref },
          { label: title, href: pathname },
        ]}
        note={status}
      />
      <section
        className="section offering-overview"
        aria-labelledby="value-title"
      >
        <div className="container offering-overview__inner">
          <div>
            <SectionHeading
              eyebrow="Giá trị cốt lõi"
              title="Một phạm vi rõ, dữ liệu rõ và cách nghiệm thu rõ"
              description="QTS tổ chức giải pháp theo mục tiêu sử dụng thực tế, giảm giả định và tạo điểm kiểm soát ở từng giai đoạn."
              id="value-title"
            />
          </div>
          <ul className="offering-checklist">
            {benefits.map((benefit) => (
              <li key={benefit}>
                <Check size={18} aria-hidden="true" /> <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section
        className="section section--surface"
        aria-labelledby="scope-title"
      >
        <div className="container">
          <SectionHeading
            eyebrow="Phạm vi triển khai"
            title="Đầu ra được xác nhận theo từng mốc"
            description="Danh sách dưới đây là khung triển khai tham khảo. Phạm vi chính thức chỉ được xác định sau bước khảo sát."
            id="scope-title"
          />
          <div className="delivery-grid">
            {(deliverables.length ? deliverables : benefits).map(
              (item, index) => (
                <article key={item}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <CircleDot size={19} aria-hidden="true" />
                  <h3>{item}</h3>
                  <p>
                    Tiêu chí nghiệm thu và người xác nhận sẽ được thống nhất
                    trong kế hoạch dự án.
                  </p>
                </article>
              ),
            )}
          </div>
        </div>
      </section>
      <section className="section" aria-labelledby="approach-title">
        <div className="container">
          <SectionHeading
            eyebrow="Cách tiếp cận"
            title="Quy trình xuyên suốt từ nhu cầu đến vận hành"
            id="approach-title"
          />
          <ol className="compact-process">
            {implementationProcess.map(([number, step, detail]) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <h3>{step}</h3>
                  <p>{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="detail-cta">
        <div className="container detail-cta__inner">
          <div>
            <span className="eyebrow">Trao đổi cùng QTS</span>
            <h2>Biến bài toán hiện tại thành phạm vi có thể triển khai</h2>
          </div>
          <div className="detail-cta__actions">
            <Link
              className={cn(buttonVariants({ variant: 'primary' }))}
              href="/bao-gia"
            >
              Yêu cầu báo giá <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'secondary' }))}
              href="/lien-he"
            >
              Nhận tư vấn
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
