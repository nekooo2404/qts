import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { AdvantagesGrid } from '@/components/public/advantages-grid'
import { BlogCard } from '@/components/public/blog-card'
import { CaseStudyCard } from '@/components/public/case-study-card'
import { HeroSection } from '@/components/public/hero-section'
import { HomeFaq } from '@/components/public/home-faq'
import { ProcessTimeline } from '@/components/public/process-timeline'
import { ProductCatalogue } from '@/components/public/product-catalogue'
import { QuoteRequestForm } from '@/components/public/quote-request-form'
import { SectionHeading } from '@/components/public/section-heading'
import { SolutionTabs } from '@/components/public/solution-tabs'
import { StatCounter } from '@/components/public/stat-counter'
import { buttonVariants } from '@/components/ui/button'
import {
  platformFacts,
  platformPrinciples,
  homeFaqs,
  solutionTabs,
} from '@/config/marketing'
import { db } from '@/lib/db'
import { createMetadata } from '@/lib/seo'
import { cn } from '@/lib/utils'

export const metadata: Metadata = createMetadata(
  'Tư vấn, phát triển hệ thống số cho doanh nghiệp',
  'QTS tư vấn, thiết kế và phát triển website, phần mềm, tích hợp hệ thống và cổng thông tin cho doanh nghiệp.',
  '/',
)

export default async function HomePage() {
  const [caseStudies, posts, ctaSettings] = await Promise.all([
    db.caseStudy.findMany({
      where: { publishedAt: { not: null } },
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
      take: 3,
    }),
    db.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        author: { select: { name: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
    db.siteSetting.findMany({
      where: {
        key: {
          in: ['homepage_final_cta_title', 'homepage_final_cta_description'],
        },
      },
    }),
  ])
  const cta = Object.fromEntries(
    ctaSettings.map((setting) => [setting.key, setting.value]),
  )

  return (
    <main id="main-content">
      <HeroSection />

      <section
        className="capability-strip"
        aria-labelledby="capability-strip-title"
      >
        <div className="container capability-strip__inner">
          <p id="capability-strip-title">
            Một luồng làm việc, sáu nguyên tắc rõ ràng
          </p>
          <ul>
            {platformPrinciples.map((principle) => (
              <li key={principle}>{principle}</li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="he-sinh-thai"
        className="section platform-section"
        aria-labelledby="ecosystem-title"
      >
        <div className="container">
          <SectionHeading
            title="Một hệ sinh thái cho nhiều nhu cầu vận hành"
            description="Các nền tảng và dịch vụ được chia thành nhóm nhỏ để doanh nghiệp chọn đúng điểm bắt đầu, sau đó xác định lộ trình kết nối phù hợp với hệ thống hiện có."
            id="ecosystem-title"
            centered
          />
          <ProductCatalogue excludePortal />
          <div className="platform-section__actions">
            <Link
              className={cn(buttonVariants({ variant: 'primary' }))}
              href="/lien-he"
            >
              Nhận tư vấn <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'secondary' }))}
              href="/bao-gia"
            >
              Xem cách lập báo giá
            </Link>
          </div>
        </div>
      </section>

      <section
        className="section section--surface solutions-section"
        aria-labelledby="solutions-title"
      >
        <div className="container">
          <SectionHeading
            title="Bắt đầu từ nút thắt vận hành, không phải từ danh sách công nghệ"
            description="Chọn nhóm nhu cầu để xem cách QTS tổ chức quy trình, dữ liệu và bề mặt làm việc tương ứng."
            id="solutions-title"
          />
          <SolutionTabs items={solutionTabs} />
        </div>
      </section>

      <section className="section section--ink" aria-labelledby="process-title">
        <div className="container">
          <SectionHeading
            title="Sáu bước từ nhu cầu đến vận hành ổn định"
            description="Mỗi bước có đầu ra và điểm xác nhận để hai bên theo dõi cùng một tiến độ."
            id="process-title"
          />
          <ProcessTimeline />
        </div>
      </section>

      <section
        className="section section--surface"
        aria-labelledby="advantages-title"
      >
        <div className="container">
          <SectionHeading
            title="Kỹ thuật tốt chỉ có ý nghĩa khi giúp vận hành rõ ràng hơn"
            description="Thiết kế, kiến trúc, bảo mật và hỗ trợ được xem như một chuỗi quyết định xuyên suốt thay vì các hạng mục rời rạc."
            id="advantages-title"
          />
          <AdvantagesGrid />
        </div>
      </section>

      {caseStudies.length > 0 && (
        <section className="section" aria-labelledby="case-study-title">
          <div className="container">
            <SectionHeading
              title="Tình huống dự án để minh họa cách QTS tiếp cận"
              description="Toàn bộ tên, bài toán và kết quả dưới đây là dữ liệu demo; case study thật chỉ được công bố khi có chấp thuận."
              id="case-study-title"
            />
            <div className="case-study-grid">
              {caseStudies.map((caseStudy) => (
                <CaseStudyCard caseStudy={caseStudy} key={caseStudy.id} />
              ))}
            </div>
            <div className="section-action">
              <Link className="inline-link" href="/du-an">
                Xem tất cả dự án mẫu <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section
        className="section section--surface stats-section"
        aria-labelledby="stats-title"
      >
        <div className="container">
          <div className="stats-section__heading">
            <h2 id="stats-title">Phạm vi đang hoạt động trong bản demo</h2>
            <p>
              Các nhãn dưới đây mô tả cấu phần có thể kiểm tra trong hệ thống,
              không phải số liệu thành tích kinh doanh.
            </p>
          </div>
          <div className="stats-grid">
            {platformFacts.map((stat) => (
              <StatCounter {...stat} key={stat.label} />
            ))}
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="section" aria-labelledby="blog-title">
          <div className="container">
            <SectionHeading
              title="Góc nhìn thực tế về sản phẩm và vận hành số"
              description="Nội dung tập trung vào cách xác định bài toán, xây hệ thống và bàn giao để đội ngũ có thể sử dụng lâu dài."
              id="blog-title"
            />
            <div className="blog-grid">
              {posts.map((post, index) => (
                <BlogCard post={post} index={index} key={post.id} />
              ))}
            </div>
            <div className="section-action">
              <Link className="inline-link" href="/blog">
                Xem tất cả bài viết <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section
        id="faq"
        className="section section--surface home-faq-section"
        aria-labelledby="home-faq-title"
      >
        <div className="container home-faq-section__inner">
          <SectionHeading
            title="Câu hỏi thường gặp trước khi bắt đầu"
            description="Phạm vi, chi phí và khả năng tích hợp chỉ được chốt sau khi QTS hiểu hệ thống đang vận hành và mục tiêu cần đạt."
            id="home-faq-title"
          />
          <HomeFaq items={homeFaqs} />
        </div>
      </section>

      <section
        className="section contact-cta"
        aria-labelledby="contact-cta-title"
      >
        <div className="container contact-cta__inner">
          <div className="contact-cta__copy">
            <h2 id="contact-cta-title">
              {cta.homepage_final_cta_title ??
                'Bắt đầu dự án công nghệ cùng QTS'}
            </h2>
            <p>
              {cta.homepage_final_cta_description ??
                'Chia sẻ bài toán và bối cảnh hiện tại. QTS sẽ phản hồi để cùng xác định phạm vi trao đổi tiếp theo.'}
            </p>
            <div className="contact-cta__note">
              <strong>Trao đổi theo đúng bối cảnh</strong>
              <span>
                QTS phản hồi qua thông tin bạn cung cấp trong biểu mẫu.
              </span>
            </div>
          </div>
          <div className="contact-cta__form">
            <QuoteRequestForm compact />
          </div>
        </div>
      </section>
    </main>
  )
}
