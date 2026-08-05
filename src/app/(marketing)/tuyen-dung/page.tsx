import type { Metadata } from 'next'
import Link from 'next/link'
import { BriefcaseBusiness, Mail } from 'lucide-react'

import { PageHero } from '@/components/public/page-hero'
import { buttonVariants } from '@/components/ui/button'
import { createMetadata } from '@/lib/seo'
import { cn } from '@/lib/utils'

export const metadata: Metadata = createMetadata(
  'Tuyển dụng',
  'Thông tin cơ hội nghề nghiệp tại QTS Technology. Các vị trí sẽ được đăng khi có nhu cầu tuyển dụng được xác nhận.',
  '/tuyen-dung',
)

export default function CareersPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Tuyển dụng QTS"
        title="Cùng xây những hệ thống được sử dụng mỗi ngày"
        description="QTS tìm kiếm những người coi trọng việc hiểu bài toán, chất lượng kỹ thuật và trải nghiệm của người dùng cuối."
        breadcrumbs={[{ label: 'Tuyển dụng', href: '/tuyen-dung' }]}
      />
      <section className="section empty-public-state">
        <div className="container--narrow">
          <BriefcaseBusiness size={34} aria-hidden="true" />
          <h2>Chưa có vị trí tuyển dụng được xác nhận</h2>
          <p>
            Danh sách vị trí, mô tả công việc, địa điểm và chế độ sẽ được cập
            nhật từ nguồn nhân sự chính thức. QTS không đăng tin giả để lấp nội
            dung.
          </p>
          <Link
            className={cn(buttonVariants({ variant: 'secondary' }))}
            href="/lien-he"
          >
            <Mail size={17} aria-hidden="true" /> Liên hệ QTS
          </Link>
        </div>
      </section>
    </main>
  )
}
