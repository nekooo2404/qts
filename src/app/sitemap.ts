import type { MetadataRoute } from 'next'

import {
  productDetails,
  serviceDetails,
  solutionDetails,
} from '@client/config/marketing'
import { db } from '@/lib/db'
import { getAppUrl } from '@/lib/seo'

const staticRoutes = [
  '',
  '/gioi-thieu',
  '/dich-vu',
  '/san-pham',
  '/giai-phap',
  '/du-an',
  '/blog',
  '/tuyen-dung',
  '/lien-he',
  '/bao-gia',
  '/chinh-sach-bao-mat',
  '/dieu-khoan-su-dung',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, caseStudies] = await Promise.all([
    db.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    db.caseStudy.findMany({
      where: { publishedAt: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
  ])
  const baseUrl = getAppUrl()
  const detailRoutes = [
    ...Object.keys(serviceDetails).map((slug) => `/dich-vu/${slug}`),
    ...Object.keys(productDetails).map((slug) => `/san-pham/${slug}`),
    ...Object.keys(solutionDetails).map((slug) => `/giai-phap/${slug}`),
  ]

  return [
    ...[...staticRoutes, ...detailRoutes].map((path) => ({
      url: new URL(path || '/', baseUrl).toString(),
      changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.7,
    })),
    ...posts.map((post) => ({
      url: new URL(`/blog/${post.slug}`, baseUrl).toString(),
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...caseStudies.map((record) => ({
      url: new URL(`/du-an/${record.slug}`, baseUrl).toString(),
      lastModified: record.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
