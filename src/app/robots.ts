import type { MetadataRoute } from 'next'

import { getAppUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/portal/', '/api/'],
    },
    sitemap: new URL('/sitemap.xml', getAppUrl()).toString(),
  }
}
