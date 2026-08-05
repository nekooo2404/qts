import type { Metadata } from 'next'

const fallbackUrl = 'http://localhost:3000'

export function getAppUrl() {
  const value = process.env.APP_URL || fallbackUrl

  try {
    return new URL(value)
  } catch {
    return new URL(fallbackUrl)
  }
}

export function createMetadata(
  title: string,
  description: string,
  pathname: string,
): Metadata {
  const canonical = new URL(pathname, getAppUrl())

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      siteName: 'QTS Technology',
      title,
      description,
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Công ty Cổ phần Công nghệ QTS',
    alternateName: 'QTS Technology',
    url: getAppUrl().toString(),
    description:
      'QTS tư vấn, thiết kế và phát triển phần mềm, website và cổng thông tin doanh nghiệp theo quy trình vận hành thực tế.',
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.path, getAppUrl()).toString(),
    })),
  }
}
