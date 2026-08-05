import type { Metadata } from 'next'

import { BlogCard } from '@/components/public/blog-card'
import { PageHero } from '@/components/public/page-hero'
import { db } from '@/lib/db'
import { createMetadata } from '@/lib/seo'

export const metadata: Metadata = createMetadata(
  'Blog công nghệ và vận hành số',
  'Góc nhìn của QTS về chuyển đổi số, phát triển phần mềm, thiết kế website, bảo mật và vận hành.',
  '/blog',
)

export default async function BlogPage() {
  const posts = await db.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    include: { author: { select: { name: true } } },
    orderBy: { publishedAt: 'desc' },
  })

  return (
    <main id="main-content">
      <PageHero
        eyebrow="Kiến thức QTS"
        title="Góc nhìn kỹ thuật dành cho người ra quyết định"
        description="Nội dung tập trung vào cách làm rõ bài toán, lựa chọn phạm vi và vận hành hệ thống sau khi triển khai."
        breadcrumbs={[{ label: 'Blog', href: '/blog' }]}
      />
      <section className="section">
        <div className="container blog-grid">
          {posts.map((post, index) => (
            <BlogCard post={post} index={index} key={post.id} />
          ))}
        </div>
      </section>
    </main>
  )
}
