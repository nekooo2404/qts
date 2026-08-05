import type { Metadata } from 'next'
import { Compass, Eye, Handshake, ShieldCheck } from 'lucide-react'

import { PageHero } from '@/components/public/page-hero'
import { SectionHeading } from '@/components/public/section-heading'
import { createMetadata } from '@/lib/seo'

export const metadata: Metadata = createMetadata(
  'Giới thiệu QTS Technology',
  'Tìm hiểu định hướng, cách làm việc và năng lực phát triển hệ thống số của Công ty Cổ phần Công nghệ QTS.',
  '/gioi-thieu',
)

const values = [
  [
    Compass,
    'Bắt đầu từ bài toán',
    'Công nghệ được lựa chọn sau khi mục tiêu, người dùng và dữ liệu đã rõ.',
  ],
  [
    Eye,
    'Minh bạch theo mốc',
    'Phạm vi, tiến độ và tiêu chí nghiệm thu được theo dõi trong suốt dự án.',
  ],
  [
    ShieldCheck,
    'Bảo mật từ thiết kế',
    'Ranh giới quyền và dữ liệu được đưa vào kiến trúc, không bổ sung ở phút cuối.',
  ],
  [
    Handshake,
    'Đồng hành khi vận hành',
    'Bàn giao gồm cả tài liệu, đầu mối hỗ trợ và cơ chế cải tiến sau triển khai.',
  ],
] as const

export default function AboutPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Về QTS"
        title="Kiến tạo hệ thống số - Tăng tốc vận hành"
        description="Công ty Cổ phần Công nghệ QTS tư vấn, thiết kế và phát triển hệ thống phần mềm, website và cổng thông tin phù hợp với quy trình vận hành thực tế."
        breadcrumbs={[{ label: 'Giới thiệu', href: '/gioi-thieu' }]}
      />
      <section
        className="section about-intro"
        aria-labelledby="about-intro-title"
      >
        <div className="container about-intro__grid">
          <div>
            <span className="eyebrow">QTS Technology</span>
            <h2 id="about-intro-title">
              Kỹ thuật, trải nghiệm và vận hành trong cùng một quyết định
            </h2>
          </div>
          <div>
            <p>
              QTS đồng hành từ phân tích yêu cầu, thiết kế trải nghiệm, phát
              triển, triển khai đến bảo trì hệ thống.
            </p>
            <p>
              Thông tin về năm thành lập, quy mô đội ngũ, địa chỉ, chứng chỉ và
              thành tích sẽ chỉ được công bố sau khi doanh nghiệp xác nhận.
            </p>
          </div>
        </div>
      </section>
      <section
        className="section section--surface"
        aria-labelledby="values-title"
      >
        <div className="container">
          <SectionHeading
            eyebrow="Nguyên tắc làm việc"
            title="Bốn nguyên tắc giữ dự án đi đúng mục tiêu"
            id="values-title"
          />
          <div className="values-grid">
            {values.map(([Icon, title, description], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <Icon size={24} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section company-facts" aria-labelledby="facts-title">
        <div className="container">
          <SectionHeading
            eyebrow="Thông tin doanh nghiệp"
            title="Các trường đang chờ dữ liệu pháp lý được xác nhận"
            id="facts-title"
          />
          <dl>
            <div>
              <dt>Tên đầy đủ</dt>
              <dd>Công ty Cổ phần Công nghệ QTS</dd>
            </div>
            <div>
              <dt>Tên tiếng Anh</dt>
              <dd>QTS Technology Joint Stock Company</dd>
            </div>
            <div>
              <dt>Địa chỉ</dt>
              <dd>[Điền địa chỉ]</dd>
            </div>
            <div>
              <dt>Mã số thuế</dt>
              <dd>[Điền mã số thuế]</dd>
            </div>
            <div>
              <dt>Điện thoại</dt>
              <dd>[Điền số điện thoại]</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>[Điền email]</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  )
}
