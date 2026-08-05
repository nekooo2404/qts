import Link from 'next/link'
import { ArrowUpRight, CalendarDays } from 'lucide-react'

import { formatDate } from '@/lib/utils'

type BlogCardProps = {
  post: {
    slug: string
    title: string
    excerpt: string
    publishedAt: Date | null
    author?: { name: string }
  }
  index?: number
}

export function BlogCard({ post, index = 0 }: BlogCardProps) {
  return (
    <article className="blog-card">
      <div className="blog-card__index" aria-hidden="true">
        <span>INSIGHT</span>
        <strong>{String(index + 1).padStart(2, '0')}</strong>
      </div>
      <div className="blog-card__body">
        <div className="blog-card__meta">
          <span>
            <CalendarDays size={14} aria-hidden="true" />{' '}
            {formatDate(post.publishedAt)}
          </span>
          {post.author && <span>{post.author.name}</span>}
        </div>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <Link className="inline-link" href={`/blog/${post.slug}`}>
          Đọc bài viết <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
