import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CalendarDays, UserRound } from 'lucide-react'

import { PageHero } from '@/components/public/page-hero'
import { StructuredData } from '@/components/shared/structured-data'
import { db } from '@/lib/db'
import { createMetadata, getAppUrl } from '@/lib/seo'
import { formatDate } from '@/lib/utils'

export async function generateStaticParams() {
  return db.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await db.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED' },
  })
  if (!post) return {}
  return createMetadata(
    post.metaTitle || post.title,
    post.metaDescription || post.excerpt,
    `/blog/${slug}`,
  )
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await db.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: { author: { select: { name: true } } },
  })
  if (!post) notFound()

  const articleUrl = new URL(`/blog/${post.slug}`, getAppUrl()).toString()

  return (
    <main id="main-content">
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.publishedAt?.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          mainEntityOfPage: articleUrl,
          author: { '@type': 'Organization', name: 'QTS Technology' },
          publisher: { '@type': 'Organization', name: 'QTS Technology' },
        }}
      />
      <PageHero
        eyebrow="QTS Insights"
        title={post.title}
        description={post.excerpt}
        breadcrumbs={[
          { label: 'Blog', href: '/blog' },
          { label: post.title, href: `/blog/${post.slug}` },
        ]}
      />
      <article className="article-body container--narrow">
        <div className="article-body__meta">
          <span>
            <CalendarDays size={16} aria-hidden="true" />{' '}
            {formatDate(post.publishedAt)}
          </span>
          <span>
            <UserRound size={16} aria-hidden="true" /> {post.author.name}
          </span>
        </div>
        {post.content.split(/\n\s*\n/).map((paragraph, index) => (
          <p key={`${post.id}-${index}`}>{paragraph}</p>
        ))}
      </article>
    </main>
  )
}
