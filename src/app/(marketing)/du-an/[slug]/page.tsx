import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

import { PageHero } from '@/components/public/page-hero'
import { db } from '@/lib/db'
import { createMetadata } from '@/lib/seo'

export async function generateStaticParams() {
  const records = await db.caseStudy.findMany({ select: { slug: true } })
  return records
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const record = await db.caseStudy.findUnique({ where: { slug } })
  if (!record) return {}
  return createMetadata(record.title, record.excerpt, `/du-an/${slug}`)
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const record = await db.caseStudy.findFirst({
    where: { slug, publishedAt: { not: null } },
  })
  if (!record) notFound()

  return (
    <main id="main-content">
      <PageHero
        eyebrow={`${record.industry} · Tình huống minh họa`}
        title={record.title}
        description={record.excerpt}
        breadcrumbs={[
          { label: 'Dự án', href: '/du-an' },
          { label: record.title, href: `/du-an/${record.slug}` },
        ]}
        note="Kịch bản mô tả phương pháp, không phải hồ sơ khách hàng thật"
      />
      <section className="section case-detail">
        <div className="container case-detail__grid">
          <article>
            <span>01 / Bài toán</span>
            <h2>Bối cảnh cần làm rõ</h2>
            <p>{record.challenge}</p>
          </article>
          <article>
            <span>02 / Giải pháp</span>
            <h2>Cách tiếp cận minh họa</h2>
            <p>{record.solution}</p>
          </article>
          <article>
            <span>03 / Đầu ra</span>
            <h2>Cấu phần cần kiểm chứng</h2>
            <p>{record.outcome}</p>
          </article>
        </div>
        <div className="container case-detail__technology">
          <h2>Nguyên tắc kỹ thuật áp dụng</h2>
          <ul>
            {[
              'Phân quyền theo vai trò và tổ chức',
              'Hợp đồng dữ liệu rõ ràng',
              'Giao diện responsive và dễ tiếp cận',
              'Kiểm thử các luồng nghiệp vụ chính',
            ].map((item) => (
              <li key={item}>
                <CheckCircle2 size={18} aria-hidden="true" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
